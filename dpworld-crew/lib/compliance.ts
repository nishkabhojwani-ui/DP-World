import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { readSheet, dataPath } from "@/lib/excel";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

export type ChecklistItemStatus = "PASS" | "FAIL" | "WARN";

export interface ComplianceChecklistItem {
  id: string;
  category: string;
  item: string;
  mandatory: boolean;
}

export interface ComplianceTemplate {
  id: string;
  name: string;
  source_file_name: string;
  source_type: string;
  created_at: string;
  items: ComplianceChecklistItem[];
}

export interface ComplianceResultItem extends ComplianceChecklistItem {
  status: ChecklistItemStatus;
  message: string;
}

export interface ComplianceRun {
  id: string;
  template_id: string;
  template_name: string;
  crew_id: string;
  crew_name: string;
  created_at: string;
  overall_status: "COMPLIANT" | "AT_RISK" | "NON_COMPLIANT";
  pass_count: number;
  fail_count: number;
  warn_count: number;
  results: ComplianceResultItem[];
}

interface CrewMemberRecord extends Record<string, unknown> {
  id: string;
  full_name: string;
  rank: string;
  nationality?: string;
  status?: string;
  current_vessel_id?: string | null;
  date_of_birth?: string;
  passport_expiry?: string;
  seaman_book_expiry?: string;
}

interface CertRecord extends Record<string, unknown> {
  crew_id: string;
  cert_type: string;
  expiry_date?: string;
  status?: string;
}

interface ContractRecord extends Record<string, unknown> {
  crew_id: string;
  vessel_id: string;
  start_date?: string;
  end_date?: string;
  sea_contract_signed?: string;
  status?: string;
}

interface RestLogRecord extends Record<string, unknown> {
  crew_id: string;
  log_date?: string;
  actual_work_hours?: number;
  rest_hours?: number;
  violation_flag?: string;
  violation_type?: string | null;
}

interface VesselRecord extends Record<string, unknown> {
  id: string;
  name?: string;
  vessel_type?: string;
  flag_state?: string;
}

interface CrewComplianceContext {
  crew: CrewMemberRecord;
  certifications: CertRecord[];
  activeContract: ContractRecord | null;
  restLogs: RestLogRecord[];
  vessel: VesselRecord | null;
}

const TEMPLATES_FILE = dataPath("compliance_templates.json");
const RUNS_FILE = dataPath("compliance_runs.json");

function todayIsoDate() {
  return new Date().toISOString();
}

async function ensureJsonArrayFile(filePath: string) {
  if (!existsSync(filePath)) {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  await ensureJsonArrayFile(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray<T>(filePath: string, rows: T[]) {
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function safeDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: unknown) {
  const date = safeDate(value);
  if (!date) return "Unknown date";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(value: unknown) {
  const date = safeDate(value);
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / 86400000);
}

function inferCategory(item: string) {
  const lower = item.toLowerCase();
  if (lower.includes("rest") || lower.includes("work hour") || lower.includes("14hr") || lower.includes("24hr")) {
    return "Rest Hours";
  }
  if (lower.includes("medical") || lower.includes("eng1")) return "Medical";
  if (lower.includes("sea") || lower.includes("contract")) return "Contract";
  if (lower.includes("passport") || lower.includes("seaman book") || lower.includes("cdc")) return "Identity";
  if (lower.includes("vessel") || lower.includes("flag")) return "Vessel";
  return "Certification";
}

function dedupeItems(items: ComplianceChecklistItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category.toLowerCase()}::${item.item.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function extractWithLlm(text: string, fileName: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for AI checklist extraction.");
  }

  const excerpt = text.slice(0, 18000);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dpworld-crew.vercel.app",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Extract verifiable compliance requirements from the uploaded document. Return JSON with key checklist_items containing an array of objects with category, item, mandatory. Keep items atomic, auditable, and short. Only include concrete requirements that could be verified against crew records, contracts, vessel details, or rest-hour logs.",
        },
        {
          role: "user",
          content: `Document name: ${fileName}\n\nDocument text:\n${excerpt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter extraction failed: ${body}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no extraction content.");
  }

  try {
    const parsed = JSON.parse(extractJsonObject(content));
    const items = Array.isArray(parsed.checklist_items) ? parsed.checklist_items : [];
    const normalized = dedupeItems(items.map((item: Record<string, unknown>, index: number) => ({
      id: `draft-${index + 1}`,
      category: cleanText(String(item.category ?? inferCategory(String(item.item ?? "")))) || "General",
      item: cleanText(String(item.item ?? "")),
      mandatory: Boolean(item.mandatory ?? true),
    })).filter((item: ComplianceChecklistItem) => item.item));

    if (normalized.length === 0) {
      throw new Error("The LLM returned no verifiable checklist items for this document.");
    }

    return normalized;
  } catch (error) {
    throw new Error(`The LLM returned invalid checklist JSON. ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function extractChecklistItems(text: string, fileName: string) {
  return extractWithLlm(text, fileName);
}

export async function listComplianceTemplates() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("compliance_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ComplianceTemplate[];
  }

  const templates = await readJsonArray<ComplianceTemplate>(TEMPLATES_FILE);
  return templates.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createComplianceTemplate(input: Omit<ComplianceTemplate, "id" | "created_at">) {
  const template: ComplianceTemplate = {
    id: randomUUID(),
    created_at: todayIsoDate(),
    ...input,
    items: input.items.map((item, index) => ({
      id: item.id || `item-${index + 1}`,
      category: cleanText(item.category) || "General",
      item: cleanText(item.item),
      mandatory: Boolean(item.mandatory),
    })).filter((item) => item.item),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("compliance_templates")
      .insert(template as never)
      .select("*")
      .single();
    if (error) throw error;
    return data as ComplianceTemplate;
  }

  const templates = await readJsonArray<ComplianceTemplate>(TEMPLATES_FILE);
  templates.unshift(template);
  await writeJsonArray(TEMPLATES_FILE, templates);
  return template;
}

export async function listComplianceRuns() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("compliance_runs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ComplianceRun[];
  }

  const runs = await readJsonArray<ComplianceRun>(RUNS_FILE);
  return runs.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function saveComplianceRun(run: ComplianceRun) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("compliance_runs").insert(run as never);
    if (error) throw error;
    return;
  }

  const runs = await readJsonArray<ComplianceRun>(RUNS_FILE);
  runs.unshift(run);
  await writeJsonArray(RUNS_FILE, runs);
}

export async function getCrewComplianceContext(crewId: string): Promise<CrewComplianceContext> {
  const [crewRows, certificationRows, contractRows, restLogRows, vesselRows] = await Promise.all([
    readSheet<CrewMemberRecord>("crew_members.xlsx"),
    readSheet<CertRecord>("certifications.xlsx"),
    readSheet<ContractRecord>("sea_contracts.xlsx"),
    readSheet<RestLogRecord>("rest_hours_log.xlsx"),
    readSheet<VesselRecord>("vessels.xlsx"),
  ]);

  const crew = crewRows.find((row) => row.id === crewId);
  if (!crew) throw new Error("Crew member not found");

  const certifications = certificationRows.filter((row) => row.crew_id === crewId);
  const activeContract = contractRows.find((row) => row.crew_id === crewId && row.status === "active") ?? null;
  const restLogs = restLogRows
    .filter((row) => row.crew_id === crewId)
    .sort((a, b) => String(b.log_date ?? "").localeCompare(String(a.log_date ?? "")));
  const vessel = activeContract ? vesselRows.find((row) => row.id === activeContract.vessel_id) ?? null : null;

  return { crew, certifications, activeContract, restLogs, vessel };
}

function findCertByKeywords(certs: CertRecord[], itemText: string) {
  const lower = itemText.toLowerCase();
  const patterns = [
    "coc",
    "gmdss",
    "stcw bst",
    "bst",
    "pscrb",
    "advanced firefighting",
    "brm",
    "erm",
    "ecdis",
    "eng1",
    "medical",
    "tanker",
    "flag endorsement",
  ];

  const explicit = patterns.find((pattern) => lower.includes(pattern));
  if (explicit) {
    return certs.find((cert) => cert.cert_type.toLowerCase().includes(explicit));
  }

  const category = inferCategory(itemText);
  if (category === "Medical") {
    return certs.find((cert) => /medical|eng1/i.test(cert.cert_type));
  }

  return null;
}

function makeCertificationMessage(cert: CertRecord, item: ComplianceChecklistItem): ComplianceResultItem {
  const certName = String(cert.cert_type);
  const remaining = daysUntil(cert.expiry_date);
  const status = String(cert.status ?? "").toLowerCase();

  if (status === "expired" || (remaining !== null && remaining < 0)) {
    return {
      ...baseChecklistItem(item),
      status: "FAIL",
      message: `${certName} expired ${formatDate(cert.expiry_date)}. Expired ${Math.abs(remaining ?? 0)} days ago.`,
    };
  }

  if (remaining !== null && remaining <= 60) {
    return {
      ...baseChecklistItem(item),
      status: "WARN",
      message: `${certName} is valid until ${formatDate(cert.expiry_date)} but expires in ${remaining} days.`,
    };
  }

  return {
    ...baseChecklistItem(item),
    status: "PASS",
    message: `${certName} is valid. Expires ${formatDate(cert.expiry_date)}${remaining !== null ? ` (${remaining} days)` : ""}.`,
  };
}

function baseChecklistItem(item: ComplianceChecklistItem): ComplianceChecklistItem {
  return {
    id: item.id,
    category: item.category,
    item: item.item,
    mandatory: item.mandatory,
  };
}

function verifyHeuristically(item: ComplianceChecklistItem, context: CrewComplianceContext): ComplianceResultItem {
  const text = item.item.toLowerCase();
  const base = baseChecklistItem(item);

  if (text.includes("passport")) {
    const remaining = daysUntil(context.crew.passport_expiry);
    if (remaining === null) {
      return { ...base, status: "WARN", message: "Passport expiry date is missing from the crew record." };
    }
    if (remaining < 0) {
      return { ...base, status: "FAIL", message: `Passport expired ${formatDate(context.crew.passport_expiry)}. Expired ${Math.abs(remaining)} days ago.` };
    }
    if (remaining <= 60) {
      return { ...base, status: "WARN", message: `Passport is valid until ${formatDate(context.crew.passport_expiry)} but expires in ${remaining} days.` };
    }
    return { ...base, status: "PASS", message: `Passport is valid until ${formatDate(context.crew.passport_expiry)} (${remaining} days).` };
  }

  if (text.includes("seaman book") || text.includes("cdc")) {
    const remaining = daysUntil(context.crew.seaman_book_expiry);
    if (remaining === null) {
      return { ...base, status: "WARN", message: "Seaman book expiry date is missing from the crew record." };
    }
    if (remaining < 0) {
      return { ...base, status: "FAIL", message: `Seaman book expired ${formatDate(context.crew.seaman_book_expiry)}. Expired ${Math.abs(remaining)} days ago.` };
    }
    if (remaining <= 60) {
      return { ...base, status: "WARN", message: `Seaman book is valid until ${formatDate(context.crew.seaman_book_expiry)} but expires in ${remaining} days.` };
    }
    return { ...base, status: "PASS", message: `Seaman book is valid until ${formatDate(context.crew.seaman_book_expiry)} (${remaining} days).` };
  }

  if (text.includes("rest") || text.includes("14hr") || text.includes("24hr") || text.includes("work in any 24")) {
    const violations = context.restLogs.filter((log) =>
      String(log.violation_flag) === "true" || Number(log.actual_work_hours ?? 0) > 14
    );
    if (violations.length === 0) {
      return { ...base, status: "PASS", message: "No recorded rest-hour breaches found in the available log history." };
    }
    const dates = violations.slice(0, 3).map((log) => formatDate(log.log_date)).join(", ");
    return {
      ...base,
      status: "FAIL",
      message: `Rest-hour violations found on ${dates}${violations.length > 3 ? ` and ${violations.length - 3} more dates` : ""}.`,
    };
  }

  if (text.includes("sea") || text.includes("contract")) {
    if (!context.activeContract) {
      return { ...base, status: "FAIL", message: "No active SEA contract found for this crew member." };
    }
    if (String(context.activeContract.sea_contract_signed) !== "true") {
      return { ...base, status: "FAIL", message: `Active SEA contract is present but not marked as signed. Start ${formatDate(context.activeContract.start_date)}.` };
    }

    const daysOnBoard = daysUntil(context.activeContract.start_date);
    const servedDays = daysOnBoard === null ? null : Math.abs(daysOnBoard);
    if (servedDays !== null && servedDays > 305) {
      return {
        ...base,
        status: "WARN",
        message: `SEA is signed and active, but service has already reached ${servedDays} days since ${formatDate(context.activeContract.start_date)}.`,
      };
    }
    return {
      ...base,
      status: "PASS",
      message: `SEA is signed by both parties. Contract start ${formatDate(context.activeContract.start_date)}.`,
    };
  }

  if (text.includes("vessel") || text.includes("flag")) {
    if (!context.vessel) {
      return { ...base, status: "WARN", message: "No active vessel assignment found to verify this item." };
    }
    return {
      ...base,
      status: "PASS",
      message: `${context.vessel.name ?? "Assigned vessel"} is linked on the active contract${context.vessel.flag_state ? ` under ${context.vessel.flag_state} flag` : ""}.`,
    };
  }

  const cert = findCertByKeywords(context.certifications, item.item);
  if (cert) {
    return makeCertificationMessage(cert, item);
  }

  if (item.mandatory) {
    return {
      ...base,
      status: "WARN",
      message: "This requirement could not be automatically matched to a structured crew field, certification, contract, or rest-hour rule.",
    };
  }

  return {
    ...base,
    status: "PASS",
    message: "No structured evidence was required for this non-mandatory item.",
  };
}

async function verifyWithLlm(template: ComplianceTemplate, context: CrewComplianceContext) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const payload = {
    crew: {
      full_name: context.crew.full_name,
      rank: context.crew.rank,
      nationality: context.crew.nationality,
      status: context.crew.status,
      current_vessel_id: context.crew.current_vessel_id,
      passport_expiry: context.crew.passport_expiry,
      seaman_book_expiry: context.crew.seaman_book_expiry,
    },
    vessel: context.vessel,
    active_contract: context.activeContract,
    certifications: context.certifications,
    rest_logs: context.restLogs.slice(0, 60),
    checklist: template.items,
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dpworld-crew.vercel.app",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a maritime compliance auditor. Evaluate each checklist item only against the supplied structured data. Return JSON with key results containing one object per checklist item: item_id, status(PASS|FAIL|WARN), message. Be concrete with dates, expiry counts, and specific evidence. If evidence is missing, return WARN rather than inventing facts.",
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(extractJsonObject(content));
    const results: Record<string, unknown>[] = Array.isArray(parsed.results) ? parsed.results : [];
    const byId = new Map<string, Record<string, unknown>>(
      results.map((result) => [String(result.item_id), result])
    );
    return template.items.map((item) => {
      const result = byId.get(item.id);
      if (!result) return verifyHeuristically(item, context);
      const status = String(result.status ?? "WARN").toUpperCase();
      return {
        ...item,
        status: status === "PASS" || status === "FAIL" || status === "WARN" ? status : "WARN",
        message: cleanText(String(result.message ?? "No explanation returned.")),
      } as ComplianceResultItem;
    });
  } catch {
    return null;
  }
}

export async function runComplianceVerification(templateId: string, crewId: string) {
  const templates = await listComplianceTemplates();
  const template = templates.find((row) => row.id === templateId);
  if (!template) throw new Error("Template not found");

  const context = await getCrewComplianceContext(crewId);
  const llmResults = await verifyWithLlm(template, context);
  const results = llmResults ?? template.items.map((item) => verifyHeuristically(item, context));

  const passCount = results.filter((row) => row.status === "PASS").length;
  const failCount = results.filter((row) => row.status === "FAIL").length;
  const warnCount = results.filter((row) => row.status === "WARN").length;
  const overallStatus =
    failCount > 0 ? "NON_COMPLIANT" :
    warnCount > 0 ? "AT_RISK" :
    "COMPLIANT";

  const run: ComplianceRun = {
    id: randomUUID(),
    template_id: template.id,
    template_name: template.name,
    crew_id: context.crew.id,
    crew_name: context.crew.full_name,
    created_at: todayIsoDate(),
    overall_status: overallStatus,
    pass_count: passCount,
    fail_count: failCount,
    warn_count: warnCount,
    results,
  };

  await saveComplianceRun(run);
  return run;
}

export function getSourceType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "PDF";
  return "TEXT";
}
