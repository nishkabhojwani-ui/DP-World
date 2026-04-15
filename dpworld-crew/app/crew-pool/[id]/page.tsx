"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CrewMember { id: string; full_name: string; rank: string; nationality: string; status: string; date_of_birth: string; seaman_book_no: string; seaman_book_expiry: string; passport_no: string; passport_expiry: string; home_airport: string; emergency_contact: unknown; current_vessel_id: string | null; }
interface Cert { id: string; cert_type: string; cert_number: string; issuing_authority: string; issued_date: string; expiry_date: string; status: string; }
interface Contract { id: string; vessel_id: string; rank_on_vessel: string; start_date: string; end_date: string; rotation_type: string; joining_port: string; sign_off_port: string; status: string; monthly_wage_usd: number; }
interface RestLog { log_date: string; actual_work_hours: number; rest_hours: number; violation_flag: string; violation_type: string | null; }
interface Vessel { id: string; name: string; }

interface AiResult {
  overall_status?: string;
  psc_risk_level?: string;
  cert_checks?: { cert_type: string; status: string; days_remaining: number; finding: string }[];
  missing_certs?: string[];
  rest_hours_summary?: { violations_count: number; worst_violation_type: string; recommendation: string };
  contract_check?: { days_on_board: number; mlc_max_days: number; status: string; finding: string };
  action_items?: { priority: string; action: string; deadline: string }[];
  recommendation?: string;
}

const CERT_BADGE: Record<string, string> = { valid: "badge-valid", expiring: "badge-expiring", expired: "badge-expired" };
const STATUS_BADGE: Record<string, string> = { onboard: "badge-onboard", available: "badge-available", leave: "badge-leave", training: "badge-training", inactive: "badge-inactive" };

export default function CrewProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [crew, setCrew] = useState<CrewMember | null>(null);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [restLogs, setRestLogs] = useState<RestLog[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crew").then(r => r.json()),
      fetch("/api/certifications").then(r => r.json()),
      fetch("/api/sea-contracts").then(r => r.json()),
      fetch("/api/rest-hours").then(r => r.json()),
      fetch("/api/vessels").then(r => r.json()),
    ]).then(([allCrew, allCerts, allContracts, allLogs, allVessels]) => {
      setCrew(allCrew.find((c: CrewMember) => c.id === id) || null);
      setCerts(allCerts.filter((c: Cert & { crew_id: string }) => c.crew_id === id)
        .sort((a: Cert, b: Cert) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()));
      setContracts(allContracts.filter((c: Contract & { crew_id: string }) => c.crew_id === id).slice(-5));
      setRestLogs(allLogs.filter((r: RestLog & { crew_id: string }) => r.crew_id === id).slice(-30));
      setVessels(allVessels);
      setLoading(false);
    });
  }, [id]);

  const runAiCheck = async () => {
    setAiLoading(true); setAiResult(null); setAiError("");
    try {
      const resp = await fetch(`/api/ai-compliance?crewId=${id}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
    } catch (e) {
      setAiError(String(e));
    }
    setAiLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" /></div>;
  if (!crew) return <div className="page-wrapper"><div className="badge badge-red">Crew member not found</div></div>;

  const vesselName = (vid: string | null) => vessels.find(v => v.id === vid)?.name || "—";
  const violations = restLogs.filter(r => r.violation_flag === "true");
  const expiredCount = certs.filter(c => c.status === "expired").length;
  const expiringCount = certs.filter(c => c.status === "expiring").length;
  const health = certs.length ? Math.round(certs.filter(c => c.status === "valid").length / certs.length * 100) : 100;

  const initials = crew.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page-wrapper">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
        <Link href="/crew-pool" className="hover:text-[var(--navy)]">Crew Pool</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{crew.full_name}</span>
      </div>

      {/* Profile Header */}
      <div className="card mb-5">
        <div className="card-body" style={{ padding: "1.5rem" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                style={{ background: "var(--navy)" }}>
                {initials}
              </div>
              <div>
                <h1 className="page-title" style={{ fontSize: "1.5rem" }}>{crew.full_name}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="badge badge-navy" style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}>{crew.rank}</span>
                  <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{crew.nationality}</span>
                  <span className={`badge ${STATUS_BADGE[crew.status] || "badge-gray"}`}>{crew.status}</span>
                  {crew.current_vessel_id && (
                    <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{vesselName(crew.current_vessel_id)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={runAiCheck} disabled={aiLoading}
                className="btn btn-teal" style={{ fontSize: "0.8125rem" }}>
                {aiLoading ? "Analysing…" : "AI Compliance Check"}
              </button>
              <Link href="/crew-changes" className="btn btn-danger">Assign to Crew Change</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Certs", value: certs.length, sub: "on file", color: "var(--navy)" },
          { label: "Valid", value: certs.filter(c => c.status === "valid").length, sub: "certificates", color: "var(--teal)" },
          { label: "Expiring <60d", value: expiringCount, sub: "need renewal", color: "var(--amber)" },
          { label: "Expired", value: expiredCount, sub: "certificates", color: expiredCount > 0 ? "var(--red)" : "var(--muted2)" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-label">{label}</div>
            <div className="kpi-value mt-2" style={{ color, fontSize: "1.75rem" }}>{value}</div>
            <div className="kpi-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Personal Details */}
        <div className="card">
          <div className="card-header"><div><p className="section-label">Identity</p><h2 className="card-title mt-0.5">Personal Details</h2></div></div>
          <div className="card-body">
            <dl className="space-y-2.5">
              {[
                ["Date of Birth", crew.date_of_birth],
                ["Seaman Book No.", crew.seaman_book_no],
                ["Seaman Book Exp.", crew.seaman_book_expiry],
                ["Passport No.", crew.passport_no],
                ["Passport Expiry", crew.passport_expiry],
                ["Home Airport", crew.home_airport],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <dt style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{label}</dt>
                  <dd className="font-semibold text-xs text-right" style={{ color: "var(--navy)" }}>{val || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Cert Health */}
        <div className="card">
          <div className="card-header"><div><p className="section-label">Compliance</p><h2 className="card-title mt-0.5">Certificate Health</h2></div></div>
          <div className="card-body">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Overall Health</span>
                <span className="font-black" style={{ fontSize: "1.5rem", color: health >= 90 ? "var(--teal)" : health >= 70 ? "var(--amber)" : "var(--red)" }}>{health}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${health}%`, background: health >= 90 ? "var(--teal)" : health >= 70 ? "var(--amber)" : "var(--red)", height: "8px" }} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              {[
                { label: "Valid", count: certs.filter(c => c.status === "valid").length, color: "var(--teal)" },
                { label: "Expiring", count: expiringCount, color: "var(--amber)" },
                { label: "Expired", count: expiredCount, color: "var(--red)" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                    <span style={{ fontSize: "0.8125rem", color: "var(--text2)" }}>{label}</span>
                  </div>
                  <span className="font-bold" style={{ color }}>{count}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                <span style={{ fontSize: "0.8125rem", color: "var(--text2)" }}>Rest violations (30d)</span>
                <span className="font-bold" style={{ color: violations.length > 0 ? "var(--red)" : "var(--teal)" }}>{violations.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Contract */}
        <div className="card">
          <div className="card-header"><div><p className="section-label">Employment</p><h2 className="card-title mt-0.5">Latest Contract</h2></div></div>
          <div className="card-body">
            {contracts.length > 0 ? (() => {
              const last = contracts[contracts.length - 1];
              return (
                <dl className="space-y-2.5">
                  {[
                    ["Vessel", vesselName(last.vessel_id)],
                    ["Rank", last.rank_on_vessel],
                    ["Start Date", last.start_date],
                    ["End Date", last.end_date],
                    ["Rotation", last.rotation_type],
                    ["Joining Port", last.joining_port],
                    ["Monthly Wage", `$${Number(last.monthly_wage_usd).toLocaleString()}`],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between items-start gap-2">
                      <dt style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{l}</dt>
                      <dd className="font-semibold text-xs text-right" style={{ color: "var(--navy)" }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              );
            })() : <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No contracts found.</div>}
          </div>
        </div>
      </div>

      {/* Certifications Table */}
      <div className="card mb-5">
        <div className="card-header">
          <div><p className="section-label">Documents</p><h2 className="card-title mt-0.5">Certifications — sorted by expiry</h2></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Certificate</th><th>Number</th><th>Issuing Authority</th><th>Issued</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {certs.map(c => (
                <tr key={c.id} style={{ background: c.status === "expired" ? "#FFF5F5" : c.status === "expiring" ? "#FFFBEB" : undefined }}>
                  <td className="td-primary">{c.cert_type}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--muted)" }}>{c.cert_number}</td>
                  <td>{c.issuing_authority}</td>
                  <td>{c.issued_date}</td>
                  <td className="font-medium">{c.expiry_date}</td>
                  <td><span className={`badge ${CERT_BADGE[c.status] || "badge-gray"}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Compliance Result */}
      {(aiLoading || aiResult || aiError) && (
        <div className="card">
          <div className="card-header">
            <div><p className="section-label">AI Analysis</p><h2 className="card-title mt-0.5">Compliance Audit</h2></div>
          </div>
          <div className="card-body">
            {aiLoading && (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-[var(--teal)] border-t-transparent rounded-full animate-spin" />
                <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Analysing compliance data…</span>
              </div>
            )}
            {aiError && <div className="alert-banner error text-sm">{aiError}</div>}
            {aiResult && (() => {
              const statusColors: Record<string, string> = { COMPLIANT: "badge-teal", AT_RISK: "badge-amber", NON_COMPLIANT: "badge-red" };
              const riskColors: Record<string, string> = { LOW: "badge-teal", MEDIUM: "badge-amber", HIGH: "badge-red" };
              const recColors: Record<string, string> = { CLEAR_FOR_DUTY: "success", CERT_RENEWAL_REQUIRED: "warning", RELIEF_RECOMMENDED: "warning", IMMEDIATE_RELIEF_REQUIRED: "error" };
              return (
                <div className="space-y-5">
                  <div className="flex gap-3 items-center flex-wrap">
                    <span className={`badge ${statusColors[aiResult.overall_status || ""] || "badge-gray"}`} style={{ fontSize: "0.875rem", padding: "0.375rem 0.875rem" }}>{aiResult.overall_status}</span>
                    {aiResult.psc_risk_level && <span className={`badge ${riskColors[aiResult.psc_risk_level] || "badge-gray"}`}>PSC Risk: {aiResult.psc_risk_level}</span>}
                    {aiResult.contract_check && (
                      <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{aiResult.contract_check.days_on_board} days on board / {aiResult.contract_check.mlc_max_days} MLC max</span>
                    )}
                  </div>

                  {aiResult.action_items && aiResult.action_items.length > 0 && (
                    <div>
                      <p className="section-label mb-2">Action Items</p>
                      <div className="space-y-1.5">
                        {aiResult.action_items.map((item, i) => (
                          <div key={i} className={`flex gap-3 items-start p-2.5 rounded-lg text-sm ${item.priority === "HIGH" ? "bg-red-50" : item.priority === "MEDIUM" ? "bg-amber-50" : "bg-gray-50"}`}>
                            <span className={`badge flex-shrink-0 ${item.priority === "HIGH" ? "badge-red" : item.priority === "MEDIUM" ? "badge-amber" : "badge-gray"}`}>{item.priority}</span>
                            <span style={{ color: "var(--text2)" }}>{item.action}</span>
                            {item.deadline && <span className="ml-auto text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>{item.deadline}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.recommendation && (
                    <div className={`alert-banner ${recColors[aiResult.recommendation] || "success"} font-bold text-sm text-center`}>
                      {aiResult.recommendation.replace(/_/g, " ")}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
