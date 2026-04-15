"use client";

import { useEffect, useState } from "react";

interface Requisition { id: string; vessel_id: string; rank_required: string; required_cert_types: unknown; joining_port: string; joining_date: string; rotation_type: string; salary_band_usd_min: number; salary_band_usd_max: number; status: string; priority: string; raised_by: string; notes: string | null; }
interface Candidate { id: string; requisition_id: string; full_name: string; rank: string; nationality: string; ai_match_score: number; pipeline_stage: string; date_of_birth: string; email: string; interview_notes: string | null; offer_accepted: string | null; rejection_reason: string | null; }
interface Vessel { id: string; name: string; }

const PIPELINE = ["applied","screening","docs_verification","interview","medical","offer","joining","rejected"];
const PIPELINE_LABELS: Record<string,string> = {
  applied:"Applied", screening:"Screening", docs_verification:"Docs Verify",
  interview:"Interview", medical:"Medical", offer:"Offer Sent", joining:"Joining", rejected:"Rejected",
};
const PRIORITY_COLORS: Record<string,string> = { normal: "bg-gray-100 text-gray-700", urgent: "bg-amber-100 text-amber-700", critical: "bg-red-100 text-red-700" };

export default function RecruitmentPage() {
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/requisitions").then(r=>r.json()),
      fetch("/api/candidates").then(r=>r.json()),
      fetch("/api/vessels").then(r=>r.json()),
    ]).then(([r,c,v]) => {
      setReqs(r); setCandidates(c); setVessels(v);
      setSelectedReq(r[0] || null);
      setLoading(false);
    });
  }, []);

  const moveStage = async (candidateId: string, newStage: string) => {
    await fetch("/api/candidates", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: candidateId, pipeline_stage: newStage }) });
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipeline_stage: newStage } : c));
  };

  const vesselName = (id: string) => vessels.find(v => v.id === id)?.name || "—";
  const reqCandidates = selectedReq ? candidates.filter(c => c.requisition_id === selectedReq.id) : [];
  const openReqs = reqs.filter(r=>r.status==="open"||r.status==="in_progress");

  // Calculate funnel stats
  const totalApplied = reqCandidates.length;
  const screened = reqCandidates.filter(c => c.pipeline_stage !== "applied").length;
  const interviewed = reqCandidates.filter(c => ["interview","medical","offer","joining"].includes(c.pipeline_stage)).length;
  const offers = reqCandidates.filter(c => ["offer","joining"].includes(c.pipeline_stage)).length;
  const joined = reqCandidates.filter(c => c.pipeline_stage === "joining").length;
  const avgScore = totalApplied > 0 ? Math.round(reqCandidates.reduce((sum, c) => sum + c.ai_match_score, 0) / totalApplied) : 0;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-[var(--muted)] text-sm">Loading recruitment data...</div></div>;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Onboarding</p>
            <h1 className="page-title">Recruitment Pipeline</h1>
            <p className="page-subtitle">Manage crew recruitment from requisition to joining</p>
          </div>
          <button onClick={() => { setShowWizard(true); setWizardStep(1); }}
            className="btn btn-danger">+ New Requisition</button>
        </div>
      </div>

      {/* Recruitment Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Open Positions</div>
          <div className="text-3xl font-bold text-[var(--navy)] mt-2">{openReqs.length}</div>
          <div className="text-xs text-[var(--muted)] mt-3">{candidates.length} total candidates</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Applications</div>
          <div className="text-3xl font-bold text-[var(--navy)] mt-2">{totalApplied}</div>
          <div className="text-xs text-[var(--muted)] mt-3">{selectedReq ? "current req" : "all reqs"}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Screened</div>
          <div className="text-3xl font-bold text-[var(--teal)] mt-2">{screened}</div>
          <div className="text-xs text-[var(--muted)] mt-3">{totalApplied > 0 ? Math.round((screened/totalApplied)*100) : 0}% conversion</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Interviews</div>
          <div className="text-3xl font-bold text-[var(--amber)] mt-2">{interviewed}</div>
          <div className="text-xs text-[var(--muted)] mt-3">{screened > 0 ? Math.round((interviewed/screened)*100) : 0}% progress</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Avg AI Match</div>
          <div className="text-3xl font-bold text-[var(--navy)] mt-2">{avgScore}%</div>
          <div className="text-xs text-[var(--muted)] mt-3">current pipeline</div>
        </div>
      </div>

      {/* Requisition List with Cards */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {openReqs.map(req => {
          const cCount = candidates.filter(c => c.requisition_id === req.id).length;
          const daysUntil = Math.round((new Date(req.joining_date).getTime() - new Date().getTime()) / 86400000);
          const reqCands = candidates.filter(c => c.requisition_id === req.id);
          const screened = reqCands.filter(c => c.pipeline_stage !== "applied").length;
          return (
            <div key={req.id} onClick={() => setSelectedReq(req)}
              className={`card cursor-pointer transition-all border-2 ${selectedReq?.id === req.id ? "border-[var(--navy)] shadow-md" : "border-[var(--border)]"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-[var(--navy)]">{req.rank_required}</div>
                  <div className="text-xs text-[var(--muted)]">{vesselName(req.vessel_id)}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-[var(--light)] rounded p-2">
                  <div className="text-sm font-bold text-[var(--navy)]">{cCount}</div>
                  <div className="text-xs text-[var(--muted)]">Applied</div>
                </div>
                <div className="bg-[var(--light)] rounded p-2">
                  <div className="text-sm font-bold text-[var(--teal)]">{screened}</div>
                  <div className="text-xs text-[var(--muted)]">Screened</div>
                </div>
                <div className="bg-[var(--light)] rounded p-2">
                  <div className="text-sm font-bold text-[var(--navy)]">${req.salary_band_usd_min?.toLocaleString()}</div>
                  <div className="text-xs text-[var(--muted)]">Min Salary</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${daysUntil < 14 ? "text-red-600" : "text-[var(--muted)]"}`}>Joining in {daysUntil}d</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === "open" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                  {req.status?.toUpperCase().replace(/_/g," ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Pipeline with Enhanced Visuals */}
      {selectedReq && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[var(--navy)]">Recruitment Funnel</h2>
                <p className="text-xs text-[var(--muted)] mt-1">{selectedReq.rank_required} for {vesselName(selectedReq.vessel_id)} • {selectedReq.joining_date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${PRIORITY_COLORS[selectedReq.priority]}`}>{selectedReq.priority}</span>
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-2 mb-6">
              {[
                { stage: "applied", count: totalApplied, label: "Applications", color: "#003D7A" },
                { stage: "screening", count: screened, label: "Screened", color: "#00A19A" },
                { stage: "interview", count: interviewed, label: "Interviewed", color: "#FFA500" },
                { stage: "offer", count: offers, label: "Offers Sent", color: "#0066FF" },
                { stage: "joining", count: joined, label: "Joined", color: "#22C55E" },
              ].map((item) => (
                <div key={item.stage} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium text-[var(--navy)]">{item.label}</div>
                  <div className="flex-1 relative h-6 bg-[var(--light)] rounded overflow-hidden">
                    <div style={{ width: `${totalApplied > 0 ? (item.count/totalApplied)*100 : 0}%`, background: item.color, height: "100%" }} className="rounded transition-all" />
                  </div>
                  <div className="w-12 text-right">
                    <span className="font-bold text-[var(--navy)]">{item.count}</span>
                    <span className="text-xs text-[var(--muted)] ml-1">({totalApplied > 0 ? Math.round((item.count/totalApplied)*100) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban Pipeline */}
          <div className="space-y-3">
            <h2 className="font-semibold text-[var(--navy)]">Candidate Pipeline — Step by Step</h2>
            <div className="grid grid-cols-8 gap-2 overflow-x-auto pb-2">
              {PIPELINE.map(stage => {
                const stageCandidates = reqCandidates.filter(c => c.pipeline_stage === stage);
                const stageIndex = PIPELINE.indexOf(stage);
                return (
                  <div key={stage} className={`rounded-xl border-2 p-3 min-w-40 flex flex-col ${stage === "rejected" ? "bg-red-50 border-red-200" : "bg-white border-[var(--border)]"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: ["#003D7A","#00A19A","#FFA500","#0066FF","#8B5CF6","#22C55E","#10B981","#EF4444"][stageIndex] }}>
                        {stageIndex + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[var(--navy)]">{PIPELINE_LABELS[stage]}</div>
                        <div className="text-xs text-[var(--muted)]">{stageCandidates.length} candidates</div>
                      </div>
                    </div>
                    <div className="space-y-2 flex-1">
                      {stageCandidates.map(c => {
                        const scoreColor = c.ai_match_score >= 85 ? "bg-teal-100 text-teal-700" : c.ai_match_score >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                        return (
                          <div key={c.id}
                            onClick={() => setSelectedCandidate(selectedCandidate?.id === c.id ? null : c)}
                            className="bg-white border border-[var(--border)] rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-all text-xs">
                            <div className="font-semibold text-[var(--navy)] truncate">{c.full_name}</div>
                            <div className="text-[var(--muted)] text-xs">{c.nationality}</div>
                            <div className="mt-2 flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold flex-1 text-center ${scoreColor}`}>{c.ai_match_score}%</span>
                            </div>
                            {stage !== "applied" && stage !== "rejected" && (
                              <button onClick={(e) => { e.stopPropagation(); const idx = PIPELINE.indexOf(stage); if (idx < PIPELINE.length - 2) moveStage(c.id, PIPELINE[idx+1]); }}
                                className="w-full mt-1.5 text-xs text-white bg-[var(--navy)] hover:bg-[var(--navy2)] rounded px-1 py-1 transition-colors">Next</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Candidate Detail Panel */}
          {selectedCandidate && (
            <div className="bg-white rounded-xl shadow-md border-2 border-[var(--navy)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[var(--navy)] text-lg">{selectedCandidate.full_name}</h3>
                  <div className="text-sm text-[var(--muted)]">{selectedCandidate.rank} • {selectedCandidate.nationality} • DOB: {selectedCandidate.date_of_birth}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-lg font-bold px-4 py-2 rounded-full ${selectedCandidate.ai_match_score >= 85 ? "bg-teal-100 text-teal-700" : selectedCandidate.ai_match_score >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {selectedCandidate.ai_match_score}%
                  </span>
                  <button onClick={() => setSelectedCandidate(null)} className="text-[var(--muted)] hover:text-[var(--text)] text-xl font-bold">Close</button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-[var(--light)] rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-1">Email</div>
                  <div className="text-sm text-[var(--text)]">{selectedCandidate.email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-1">Current Stage</div>
                  <div className="text-sm text-[var(--navy)] font-semibold">{PIPELINE_LABELS[selectedCandidate.pipeline_stage]}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-1">Interview Notes</div>
                  <div className="text-sm text-[var(--muted)]">{selectedCandidate.interview_notes || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-1">Offer Status</div>
                  <div className={`text-sm font-semibold ${selectedCandidate.offer_accepted === "true" ? "text-teal-600" : selectedCandidate.rejection_reason ? "text-red-600" : "text-[var(--muted)]"}`}>
                    {selectedCandidate.offer_accepted === "true" ? "Accepted" : selectedCandidate.rejection_reason ? "Rejected" : "Pending"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {PIPELINE.indexOf(selectedCandidate.pipeline_stage) < PIPELINE.length - 2 && (
                  <button onClick={() => { const idx = PIPELINE.indexOf(selectedCandidate.pipeline_stage); moveStage(selectedCandidate.id, PIPELINE[idx+1]); setSelectedCandidate(prev => prev ? {...prev, pipeline_stage: PIPELINE[idx+1]} : null); }}
                    className="flex-1 px-4 py-2.5 bg-[var(--navy)] text-white text-sm rounded-lg hover:bg-[var(--navy2)] transition-colors font-medium">
                    Proceed to {PIPELINE_LABELS[PIPELINE[PIPELINE.indexOf(selectedCandidate.pipeline_stage)+1]]}
                  </button>
                )}
                <button onClick={() => { moveStage(selectedCandidate.id, "rejected"); setSelectedCandidate(prev => prev ? {...prev, pipeline_stage: "rejected"} : null); }}
                  className="px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200">
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Requisition Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[var(--border)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--navy)]">Create New Requisition</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">Step {wizardStep} of 3</p>
                </div>
                <button onClick={() => setShowWizard(false)} className="text-[var(--muted)] hover:text-[var(--text)] text-sm font-bold">Close</button>
              </div>
              {/* Progress bar */}
              <div className="flex gap-1 mt-4">
                {[1,2,3].map(i => (
                  <div key={i} className={`flex-1 h-1 rounded ${i <= wizardStep ? "bg-[var(--navy)]" : "bg-[var(--light)]"}`} />
                ))}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Select Vessel</label>
                    <select className="w-full input p-2">
                      {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Rank Required</label>
                    <input type="text" placeholder="e.g., Chief Officer" className="w-full input p-2 border border-[var(--border)] rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Priority</label>
                    <div className="flex gap-2">
                      {["normal","urgent","critical"].map(p => (
                        <button key={p} className={`flex-1 p-2 rounded border-2 text-sm font-medium ${PRIORITY_COLORS[p]}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Joining Date</label>
                      <input type="date" className="w-full input p-2 border border-[var(--border)] rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Joining Port</label>
                      <input type="text" placeholder="e.g., Singapore" className="w-full input p-2 border border-[var(--border)] rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Rotation Type</label>
                    <select className="w-full input p-2 border border-[var(--border)] rounded">
                      <option>Fixed Term</option>
                      <option>Annual</option>
                      <option>On-demand</option>
                    </select>
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Min Salary (USD/mo)</label>
                      <input type="number" placeholder="5000" className="w-full input p-2 border border-[var(--border)] rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Max Salary (USD/mo)</label>
                      <input type="number" placeholder="7000" className="w-full input p-2 border border-[var(--border)] rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Required Certificates</label>
                    <input type="text" placeholder="STCW, GMDSS, etc." className="w-full input p-2 border border-[var(--border)] rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Additional Notes</label>
                    <textarea placeholder="Any special requirements..." className="w-full input p-2 border border-[var(--border)] rounded" rows={3}></textarea>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[var(--border)] p-6 flex gap-3">
              {wizardStep > 1 && (
                <button onClick={() => setWizardStep(wizardStep - 1)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--light)]">
                  ← Back
                </button>
              )}
              {wizardStep < 3 && (
                <button onClick={() => setWizardStep(wizardStep + 1)} className="flex-1 px-4 py-2 bg-[var(--navy)] text-white rounded-lg hover:bg-[var(--navy2)]">
                  Next Step
                </button>
              )}
              {wizardStep === 3 && (
                <button onClick={() => { setShowWizard(false); setWizardStep(1); }} className="flex-1 px-4 py-2 bg-[var(--navy)] text-white rounded-lg hover:bg-[var(--navy2)]">
                  Create Requisition
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
