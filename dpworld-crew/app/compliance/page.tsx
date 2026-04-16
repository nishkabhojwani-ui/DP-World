"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ComplianceWorkflow from "@/components/ComplianceWorkflow";
import AIBadge from "@/components/AIBadge";

interface CrewMember { id: string; full_name: string; rank: string; status: string; current_vessel_id: string | null; }
interface Cert { id: string; crew_id: string; cert_type: string; expiry_date: string; status: string; }
interface Contract { id: string; crew_id: string; vessel_id: string; start_date: string; end_date: string; status: string; sea_contract_signed: string; }
interface RestLog { id: string; crew_id: string; vessel_id: string; log_date: string; actual_work_hours: number; rest_hours: number; violation_flag: string; violation_type: string | null; force_majeure: string; }
interface CrewChange { id: string; vessel_id: string; planned_date: string; status: string; }
interface Checklist { crew_change_id: string; ok_to_board: string; [key: string]: string; }
interface Vessel { id: string; name: string; }

const STCW_COLS = [
  { key: "CoC",            label: "CoC" },
  { key: "GMDSS",         label: "GMDSS" },
  { key: "BST",           label: "BST" },
  { key: "PSCRB",         label: "PSCRB" },
  { key: "Firefighting",  label: "Fire" },
  { key: "RM",            label: "BRM/ERM" },
  { key: "ECDIS",         label: "ECDIS" },
  { key: "Medical",       label: "Medical" },
];
const RANK_REQUIRED: Record<string, string[]> = {
  Master: ["CoC Class I","GMDSS GOC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "Chief Officer": ["CoC Class II","GMDSS GOC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "2nd Officer": ["CoC OOW Deck","GMDSS ROC","STCW BST","PSCRB","Advanced Firefighting","BRM","Medical ENG1"],
  "3rd Officer": ["CoC OOW Deck","GMDSS ROC","STCW BST","PSCRB","Advanced Firefighting","Medical ENG1"],
  "Chief Engineer": ["CoC Class I Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  "2nd Engineer": ["CoC OOW Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  "3rd Engineer": ["CoC OOW Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  Bosun: ["STCW BST","PSCRB","Medical ENG1"], AB: ["STCW BST","PSCRB","Medical ENG1"],
  Oiler: ["STCW BST","Medical ENG1"], Cook: ["STCW BST","Medical ENG1"],
  Electrician: ["CoC Electro-Technical Officer","STCW BST","PSCRB","Medical ENG1"],
  Pumpman: ["STCW BST","Advanced Tanker Training","Medical ENG1"],
};

export default function CompliancePage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [restLogs, setRestLogs] = useState<RestLog[]>([]);
  const [changes, setChanges] = useState<CrewChange[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crew").then(r => r.json()),
      fetch("/api/certifications").then(r => r.json()),
      fetch("/api/sea-contracts").then(r => r.json()),
      fetch("/api/rest-hours").then(r => r.json()),
      fetch("/api/crew-changes").then(r => r.json()),
      fetch("/api/checklists").then(r => r.json()),
      fetch("/api/vessels").then(r => r.json()),
    ]).then(([cm, ce, co, rl, ch, cl, v]) => {
      setCrew(cm); setCerts(ce); setContracts(co);
      setRestLogs(rl); setChanges(ch); setChecklists(cl); setVessels(v);
      setLoading(false);
    });
  }, []);

  const onboardCrew = crew.filter(c => c.status === "onboard");
  const vesselName = (id: string) => vessels.find(v => v.id === id)?.name || id;

  const pscScore = (vid: string) => {
    const ids = onboardCrew.filter(c => c.current_vessel_id === vid).map(c => c.id);
    const vc = certs.filter(c => ids.includes(c.crew_id));
    const certScore = vc.length ? vc.filter(c => c.status === "valid").length / vc.length * 100 : 100;
    const now = new Date();
    const mo = new Date(now.getFullYear(), now.getMonth(), 1);
    const vl = restLogs.filter(r => ids.includes(r.crew_id) && new Date(r.log_date) >= mo);
    const restScore = vl.length ? (1 - vl.filter(r => r.violation_flag === "true").length / vl.length) * 100 : 100;
    const vc2 = contracts.filter(c => c.vessel_id === vid && c.status === "active");
    const seaScore = vc2.length ? vc2.filter(c => c.sea_contract_signed === "true").length / vc2.length * 100 : 100;
    const vch = changes.filter(c => c.vessel_id === vid && c.status !== "completed");
    const clScore = vch.length ? vch.filter(c => checklists.find(cl => cl.crew_change_id === c.id && cl.ok_to_board === "true")).length / vch.length * 100 : 100;
    return Math.round(certScore * 0.4 + restScore * 0.3 + seaScore * 0.2 + clScore * 0.1);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" /></div>;

  const TABS = ["AI Verification", "Certificate Matrix", "Rest Hours", "SEA Compliance", "Pre-Joining SOP", "PSC Readiness"];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">MLC 2006 / STCW</p>
            <h1 className="page-title">Compliance Center</h1>
            <p className="page-subtitle">AI-powered monitoring: extraction, verification, PSC prep & natural language Q&A</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <AIBadge type="generated" size="sm" />
              <AIBadge type="verified" size="sm" />
              <AIBadge type="analyzed" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} className={`tab-item ${tab === i ? "active" : ""}`}>{t}</button>
          ))}
        </div>

        <div style={{ padding: "1.25rem" }}>

          {/* Tab 0: AI Verification */}
          {tab === 0 && <ComplianceWorkflow />}

          {/* Tab 1: Cert Matrix */}
          {tab === 1 && (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: "var(--bg)", zIndex: 2 }}>Crew Member</th>
                    <th>Rank</th>
                    {STCW_COLS.map(c => <th key={c.key} style={{ textAlign: "center" }}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {onboardCrew.slice(0, 42).map(cm => {
                    const crewCerts = certs.filter(c => c.crew_id === cm.id);
                    const required = RANK_REQUIRED[cm.rank] || [];
                    return (
                      <tr key={cm.id}>
                        <td style={{ position: "sticky", left: 0, background: "white", zIndex: 1 }}>
                          <Link href={`/crew-pool/${cm.id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{cm.full_name}</Link>
                        </td>
                        <td className="td-primary">{cm.rank}</td>
                        {STCW_COLS.map(col => {
                          const isRequired = required.some(r => r.toLowerCase().includes(col.key.toLowerCase()));
                          if (!isRequired) return <td key={col.key} style={{ textAlign: "center", color: "var(--muted2)" }}>—</td>;
                          const cert = crewCerts.find(c => c.cert_type.toLowerCase().includes(col.key.toLowerCase()));
                          const status = cert ? cert.status : "missing";
                          const styles: Record<string, { bg: string; color: string; text: string }> = {
                            valid:   { bg: "#DCFCE7", color: "#15803D", text: "Y" },
                            expiring:{ bg: "#FEF3C7", color: "#B45309", text: "!" },
                            expired: { bg: "#FEE2E2", color: "#B91C1C", text: "N" },
                            missing: { bg: "#F1F5F9", color: "#94A3B8", text: "?" },
                          };
                          const s = styles[status] || styles.missing;
                          return (
                            <td key={col.key} style={{ textAlign: "center" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 4, background: s.bg, color: s.color, fontSize: "0.625rem", fontWeight: 800 }}>{s.text}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex gap-5 mt-4">
                {[["#DCFCE7","#15803D","Y","Valid"], ["#FEF3C7","#B45309","!","Expiring <60d"], ["#FEE2E2","#B91C1C","N","Expired"], ["#F1F5F9","#94A3B8","?","Missing"]].map(([bg,color,icon,label]) => (
                  <div key={label} className="flex items-center gap-2" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 3, background: bg, color, fontSize: "0.5625rem", fontWeight: 800 }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Rest Hours */}
          {tab === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[["Max work / 24h","14h","var(--red)"],["Max work / 7d","72h","var(--amber)"],["Min rest / 24h","10h","var(--teal)"],["Min rest / 7d","77h","var(--teal)"]].map(([l,v,c]) => (
                  <div key={l} className="kpi-card" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
                    <div className="kpi-label">{l}</div>
                    <div className="font-black mt-1" style={{ fontSize: "1.5rem", color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <table className="data-table">
                <thead><tr><th>Crew Member</th><th>Date</th><th>Work Hours</th><th>Rest Hours</th><th>Violation Type</th><th>Force Majeure</th></tr></thead>
                <tbody>
                  {restLogs.filter(r => r.violation_flag === "true").map((r, i) => {
                    const cm = crew.find(c => c.id === r.crew_id);
                    return (
                      <tr key={i} style={{ background: "#FFF5F5" }}>
                        <td><Link href={`/crew-pool/${r.crew_id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{cm?.full_name || "—"}</Link></td>
                        <td>{r.log_date}</td>
                        <td><span className="font-bold" style={{ color: "var(--red)" }}>{r.actual_work_hours}h</span></td>
                        <td><span className="font-bold" style={{ color: "var(--red)" }}>{r.rest_hours}h</span></td>
                        <td><span className="badge badge-red">{r.violation_type?.replace(/_/g, " ") || "—"}</span></td>
                        <td><span className={`badge ${r.force_majeure === "true" ? "badge-amber" : "badge-gray"}`}>{r.force_majeure === "true" ? "Yes" : "No"}</span></td>
                      </tr>
                    );
                  })}
                  {restLogs.filter(r => r.violation_flag === "true").length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--teal)", fontWeight: 600 }}>No violations found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: SEA Compliance */}
          {tab === 3 && (
            <table className="data-table">
              <thead><tr><th>Crew Member</th><th>Vessel</th><th>Start</th><th>End</th><th>Days</th><th>SEA Signed</th><th>MLC Status</th></tr></thead>
              <tbody>
                {contracts.filter(c => c.status === "active").map((c, i) => {
                  const cm = crew.find(cr => cr.id === c.crew_id);
                  const days = Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000);
                  const mlcViolation = days > 335;
                  const endingSoon = Math.round((new Date(c.end_date).getTime() - new Date().getTime()) / 86400000) < 30;
                  return (
                    <tr key={i} style={{ background: mlcViolation ? "#FFF5F5" : endingSoon ? "#FFFBEB" : undefined }}>
                      <td><Link href={`/crew-pool/${c.crew_id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{cm?.full_name || "—"}</Link></td>
                      <td>{vesselName(c.vessel_id)}</td>
                      <td>{c.start_date}</td>
                      <td>{c.end_date}</td>
                      <td><span className="font-bold" style={{ color: mlcViolation ? "var(--red)" : "var(--text)" }}>{days}d {mlcViolation ? "!" : ""}</span></td>
                      <td><span className={`badge ${c.sea_contract_signed === "true" ? "badge-teal" : "badge-red"}`}>{c.sea_contract_signed === "true" ? "Signed" : "Missing"}</span></td>
                      <td><span className={`badge ${mlcViolation ? "badge-red" : endingSoon ? "badge-amber" : "badge-teal"}`}>{mlcViolation ? "Exceeds 11mo" : endingSoon ? "Ending Soon" : "Compliant"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Tab 4: Pre-Joining SOP */}
          {tab === 4 && (
            <div className="space-y-3">
              {changes.filter(c => c.status !== "completed").map((cc, i) => {
                const cl = checklists.find(c => c.crew_change_id === cc.id);
                const fields = ["passport_valid","cdc_valid","coc_valid","stcw_bst_valid","medical_valid","flag_endorsement_valid","visa_ok","yellow_fever_valid","sea_signed","ok_to_board"];
                const done = cl ? fields.filter(f => cl[f] === "true").length : 0;
                const daysUntil = Math.round((new Date(cc.planned_date).getTime() - new Date().getTime()) / 86400000);
                const isUrgent = daysUntil < 7 && cl?.ok_to_board !== "true";
                return (
                  <div key={i} className="card" style={{ border: isUrgent ? "1px solid #FECACA" : undefined }}>
                    <div style={{ height: "3px", background: done === 11 ? "var(--teal)" : isUrgent ? "var(--red)" : "var(--amber)" }} />
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold" style={{ color: "var(--navy)" }}>{vesselName(cc.vessel_id)}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Joining: {cc.planned_date} · {daysUntil} days away</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black" style={{ color: done === 11 ? "var(--teal)" : isUrgent ? "var(--red)" : "var(--amber)", fontSize: "1.25rem" }}>{done}/11</span>
                          {isUrgent && <span className="badge badge-red">Urgent</span>}
                          {cl?.ok_to_board === "true" && <span className="badge badge-teal">OK to Board</span>}
                        </div>
                      </div>
                      <div className="progress-bar mt-3">
                        <div className="progress-fill" style={{ width: `${(done / 11) * 100}%`, background: done === 11 ? "var(--teal)" : isUrgent ? "var(--red)" : "var(--amber)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 5: PSC Readiness */}
          {tab === 5 && (
            <div className="grid grid-cols-2 gap-4">
              {vessels.map(v => {
                const score = pscScore(v.id);
                const color = score >= 85 ? "var(--teal)" : score >= 70 ? "var(--amber)" : "var(--red)";
                const badgeClass = score >= 85 ? "badge-teal" : score >= 70 ? "badge-amber" : "badge-red";
                return (
                  <div key={v.id} className="card">
                    <div style={{ height: "3px", background: color }} />
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/vessels/${v.id}`} className="font-bold hover:underline" style={{ color: "var(--navy)" }}>{v.name}</Link>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${badgeClass}`}>{score >= 85 ? "Ready" : score >= 70 ? "At Risk" : "Not Ready"}</span>
                          <span className="font-black" style={{ color, fontSize: "1.5rem" }}>{score}%</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
                      </div>
                      <div className="flex justify-between mt-2" style={{ fontSize: "0.6875rem", color: "var(--muted2)" }}>
                        <span>Certs 40%</span><span>Rest Hrs 30%</span><span>SEA 20%</span><span>SOP 10%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
