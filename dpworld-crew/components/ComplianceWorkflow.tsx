"use client";

import { useEffect, useRef, useState } from "react";

interface CrewMember {
  id: string;
  full_name: string;
  rank: string;
  status: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  mandatory: boolean;
}

interface ComplianceTemplate {
  id: string;
  name: string;
  source_file_name: string;
  source_type: string;
  created_at: string;
  items: ChecklistItem[];
}

interface ComplianceRunSummary {
  id: string;
  template_name: string;
  crew_name: string;
  created_at: string;
  overall_status: "COMPLIANT" | "AT_RISK" | "NON_COMPLIANT";
  pass_count: number;
  fail_count: number;
  warn_count: number;
}

interface ComplianceResultItem extends ChecklistItem {
  status: "PASS" | "FAIL" | "WARN";
  message: string;
}

const EMPTY_DRAFT_ROW = () => ({
  id: `draft-${Math.random().toString(36).slice(2, 8)}`,
  category: "General",
  item: "",
  mandatory: true,
});

const statusClass: Record<string, string> = {
  PASS: "badge-green",
  FAIL: "badge-red",
  WARN: "badge-amber",
  COMPLIANT: "badge-green",
  AT_RISK: "badge-amber",
  NON_COMPLIANT: "badge-red",
};

async function readNdjsonStream<T>(
  response: Response,
  onEvent: (payload: T) => void
) {
  if (!response.body) throw new Error("Streaming response body missing");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      onEvent(JSON.parse(trimmed));
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer));
  }
}

export default function ComplianceWorkflow() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [runs, setRuns] = useState<ComplianceRunSummary[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draftTemplateName, setDraftTemplateName] = useState("");
  const [draftSourceFileName, setDraftSourceFileName] = useState("");
  const [draftSourceType, setDraftSourceType] = useState("TEXT");
  const [draftItems, setDraftItems] = useState<ChecklistItem[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [running, setRunning] = useState(false);
  const [liveResults, setLiveResults] = useState<ComplianceResultItem[]>([]);
  const [runSummary, setRunSummary] = useState<ComplianceRunSummary | null>(null);
  const [error, setError] = useState("");
  const resultAnchorRef = useRef<HTMLDivElement | null>(null);
  const checklistAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/crew").then((r) => r.json()),
      fetch("/api/compliance-templates").then((r) => r.json()),
      fetch("/api/compliance-runs").then((r) => r.json()),
    ]).then(([crewRows, templateRows, runRows]) => {
      setCrew(crewRows);
      setTemplates(templateRows);
      setRuns(runRows);
      if (crewRows[0]) setSelectedCrewId(crewRows[0].id);
      if (templateRows[0]) setSelectedTemplateId(templateRows[0].id);
    }).catch((err) => {
      setError(String(err));
    });
  }, []);

  useEffect(() => {
    resultAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [liveResults.length]);

  useEffect(() => {
    if (draftItems.length > 0 && !extracting) {
      checklistAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [draftItems.length, extracting]);

  const refreshSavedData = async () => {
    const [templateRows, runRows] = await Promise.all([
      fetch("/api/compliance-templates").then((r) => r.json()),
      fetch("/api/compliance-runs").then((r) => r.json()),
    ]);
    setTemplates(templateRows);
    setRuns(runRows);
    if (!selectedTemplateId && templateRows[0]) setSelectedTemplateId(templateRows[0].id);
  };

  const updateDraftItem = (id: string, patch: Partial<ChecklistItem>) => {
    setDraftItems((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  };

  const removeDraftItem = (id: string) => {
    setDraftItems((rows) => rows.filter((row) => row.id !== id));
  };

  const handleExtract = async (fileOverride?: File | null) => {
    const file = fileOverride ?? selectedFile;
    if (!file) {
      setError("Choose a PDF or text document first.");
      return;
    }

    setError("");
    setDraftItems([]);
    setDraftTemplateName(file.name.replace(/\.[^.]+$/, ""));
    setDraftSourceFileName(file.name);
    setExtracting(true);
    setExtractNotice("AI is reading the uploaded document and building the checklist...");
    setRunSummary(null);

    try {
      let extractedCount = 0;
      const startedAt = Date.now();
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/compliance-templates/extract", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());

      await readNdjsonStream<{ type: string; item?: ChecklistItem; source_file_name?: string; source_type?: string }>(response, (event) => {
        if (event.type === "item" && event.item) {
          extractedCount += 1;
          setDraftItems((rows) => [...rows, event.item!]);
        }
        if (event.type === "done") {
          setDraftSourceFileName(event.source_file_name ?? file.name);
          setDraftSourceType(event.source_type ?? "TEXT");
        }
      });

      const elapsed = Date.now() - startedAt;
      if (elapsed < 1800) {
        await new Promise((resolve) => setTimeout(resolve, 1800 - elapsed));
      }

      setExtractNotice(`Checklist ready. ${file.name} was converted into ${extractedCount} items.`);
    } catch (err) {
      setExtractNotice("");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    if (!file) {
      setDraftItems([]);
      setExtractNotice("");
      return;
    }
    await handleExtract(file);
  };

  const handleSaveTemplate = async () => {
    const items = draftItems
      .map((item) => ({
        ...item,
        category: item.category.trim() || "General",
        item: item.item.trim(),
      }))
      .filter((item) => item.item);

    if (!draftTemplateName.trim()) {
      setError("Template name is required.");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one checklist item before saving.");
      return;
    }

    setSavingTemplate(true);
    setError("");
    try {
      const response = await fetch("/api/compliance-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftTemplateName.trim(),
          source_file_name: draftSourceFileName || "Manual entry",
          source_type: draftSourceType,
          items,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const saved = await response.json();
      setDraftItems([]);
      setDraftTemplateName("");
      setDraftSourceFileName("");
      setSelectedFile(null);
      await refreshSavedData();
      setSelectedTemplateId(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleRun = async () => {
    if (!selectedCrewId || !selectedTemplateId) {
      setError("Select both a crew member and a template.");
      return;
    }

    setError("");
    setRunning(true);
    setLiveResults([]);
    setRunSummary(null);

    try {
      const response = await fetch("/api/compliance-runs/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crew_id: selectedCrewId,
          template_id: selectedTemplateId,
        }),
      });
      if (!response.ok) throw new Error(await response.text());

      await readNdjsonStream<{ type: string; result?: ComplianceResultItem; run?: ComplianceRunSummary }>(response, (event) => {
        if (event.type === "result" && event.result) {
          setLiveResults((rows) => [...rows, event.result!]);
        }
        if (event.type === "done" && event.run) {
          setRunSummary(event.run);
        }
      });

      await refreshSavedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="alert-banner error">
          <div className="font-semibold">Workflow error</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="section-label">Step 1</p>
              <h2 className="card-title mt-0.5">Upload Document</h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            <label className="upload-zone">
              <input
                type="file"
                accept=".pdf,.txt,.md,.csv"
                className="hidden"
                onChange={(event) => {
                  void handleFileChange(event.target.files?.[0] ?? null);
                }}
              />
              <div className="upload-zone-title">{selectedFile ? selectedFile.name : "Select PDF or text document"}</div>
              <div className="upload-zone-subtitle">
                {extracting
                  ? "Reading document and generating checklist with AI..."
                  : "MLC SOP, PSC checklist, company procedure, or any text-based compliance source."}
              </div>
            </label>

            <div className="flex gap-2">
              <button className="btn btn-primary" disabled={extracting || !selectedFile} onClick={() => void handleExtract()}>
                {extracting ? "Extracting..." : "Re-run Extraction"}
              </button>
              <button className="btn btn-ghost" onClick={() => setDraftItems((rows) => [...rows, EMPTY_DRAFT_ROW()])}>
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {extractNotice && (
                <div className={`extraction-notice ${extracting ? "reading" : "done"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {extracting ? <div className="notice-spinner" /> : <div className="notice-dot" />}
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                          {extracting ? "Reading Document" : "Checklist Generated"}
                        </div>
                        <div className="text-sm" style={{ color: "var(--muted)" }}>{extractNotice}</div>
                      </div>
                    </div>
                    {!extracting && <span className="badge badge-navy">Generated by AI</span>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[1.5fr_1fr] gap-3">
                <input
                  value={draftTemplateName}
                  onChange={(event) => setDraftTemplateName(event.target.value)}
                  placeholder="Template name"
                  className="form-input"
                />
                <input
                  value={draftSourceFileName}
                  onChange={(event) => setDraftSourceFileName(event.target.value)}
                  placeholder="Source filename"
                  className="form-input"
                />
              </div>

              <div
                ref={checklistAnchorRef}
                className={`space-y-2 pr-1 ${draftItems.length > 0 ? "checklist-panel ready" : "checklist-panel"}`}
              >
                {draftItems.length > 0 && (
                  <div className="checklist-panel-header">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                        Extracted Checklist Items
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>
                        Review the AI-generated checklist below, then save the template.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-teal">{draftItems.length} items ready</span>
                      <span className="badge badge-navy">Generated by AI</span>
                    </div>
                  </div>
                )}
                {draftItems.length === 0 && (
                  <div className="empty-state">
                    Upload a document and the LLM will read it and generate checklist items here automatically.
                  </div>
                )}
                {draftItems.map((item) => (
                  <div key={item.id} className="draft-item-card">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={item.category}
                          onChange={(event) => updateDraftItem(item.id, { category: event.target.value })}
                          className="form-input"
                          placeholder="Category (e.g., Certifications, Medical, etc.)"
                        />
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <input
                              type="checkbox"
                              checked={item.mandatory}
                              onChange={(event) => updateDraftItem(item.id, { mandatory: event.target.checked })}
                            />
                            Mandatory
                          </label>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeDraftItem(item.id)}>Remove</button>
                        </div>
                      </div>
                      <textarea
                        value={item.item}
                        onChange={(event) => updateDraftItem(item.id, { item: event.target.value })}
                        className="form-textarea w-full"
                        rows={3}
                        placeholder="Checklist item - describe what needs to be verified"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-teal" disabled={savingTemplate || extracting || draftItems.length === 0} onClick={handleSaveTemplate}>
                {savingTemplate ? "Saving..." : `Save Template${draftItems.length > 0 ? ` (${draftItems.length})` : ""}`}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="section-label">Step 2</p>
              <h2 className="card-title mt-0.5">Run Verification</h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select className="form-input" value={selectedCrewId} onChange={(event) => setSelectedCrewId(event.target.value)}>
                {crew.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} · {member.rank}
                  </option>
                ))}
              </select>
              <select className="form-input" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn btn-danger" disabled={running || templates.length === 0} onClick={handleRun}>
                {running ? "Running..." : "Run Compliance Verification"}
              </button>
              {(running || liveResults.length > 0 || runSummary) && (
                <span className="badge badge-navy">Verified by AI</span>
              )}
            </div>

            <div className="results-stream">
              {liveResults.length === 0 && !runSummary && (
                <div className="empty-state">
                  Item-by-item verdicts will stream here as the verification runs.
                </div>
              )}

              {liveResults.map((result) => (
                <div key={`${result.id}-${result.status}-${result.message}`} className="stream-line">
                  <span className={`badge ${statusClass[result.status]}`}>{result.status}</span>
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{result.item}</div>
                    <div className="text-sm text-slate-600">{result.message}</div>
                  </div>
                </div>
              ))}
              <div ref={resultAnchorRef} />
            </div>

            {runSummary && (
              <div className="alert-banner success">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">Final Verdict</div>
                    <div className="text-sm">
                      {runSummary.pass_count} passed · {runSummary.fail_count} failed · {runSummary.warn_count} warning
                      {runSummary.warn_count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${statusClass[runSummary.overall_status]}`}>{runSummary.overall_status.replace("_", " ")}</span>
                    <span className="badge badge-navy">Verified by AI</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="section-label">Templates</p>
              <h2 className="card-title mt-0.5">Saved Compliance Templates</h2>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Items</th>
                  <th>Type</th>
                  <th>Saved</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="td-primary">{template.name}</td>
                    <td>{template.source_file_name}</td>
                    <td>{template.items.length}</td>
                    <td><span className="badge badge-navy">Generated by AI</span></td>
                    <td>{new Date(template.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">No saved templates yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="section-label">Runs</p>
              <h2 className="card-title mt-0.5">Recent Verification Runs</h2>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crew</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Counts</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((run) => (
                  <tr key={run.id}>
                    <td className="td-primary">{run.crew_name}</td>
                    <td>{run.template_name}</td>
                    <td><span className={`badge ${statusClass[run.overall_status]}`}>{run.overall_status.replace("_", " ")}</span></td>
                    <td><span className="badge badge-navy">Verified by AI</span></td>
                    <td>{run.pass_count} / {run.fail_count} / {run.warn_count}</td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">No verification runs saved yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
