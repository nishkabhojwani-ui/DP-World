"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Vessel { id: string; name: string; imo_number: string; flag_state: string; vessel_type: string; home_port: string; current_port: string; gross_tonnage: number; trading_area: string; status: string; required_manning: unknown; }
interface CrewMember { id: string; full_name: string; rank: string; status: string; current_vessel_id: string | null; }
interface Contract { id: string; crew_id: string; vessel_id: string; rank_on_vessel: string; start_date: string; end_date: string; status: string; }
interface CrewChange { vessel_id: string; rank: string; planned_date: string; status: string; change_port: string; }
interface Cert { crew_id: string; status: string; }

export default function VesselDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [changes, setChanges] = useState<CrewChange[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/vessels").then(r => r.json()),
      fetch("/api/crew").then(r => r.json()),
      fetch("/api/sea-contracts").then(r => r.json()),
      fetch("/api/crew-changes").then(r => r.json()),
      fetch("/api/certifications").then(r => r.json()),
    ]).then(([vs, cm, cc, chg, ce]) => {
      setVessel(vs.find((v: Vessel) => v.id === id) || null);
      setCrew(cm.filter((c: CrewMember) => c.current_vessel_id === id));
      setContracts(cc.filter((c: Contract) => c.vessel_id === id && c.status === "active"));
      setChanges(chg.filter((c: CrewChange) => c.vessel_id === id && c.status !== "completed"));
      setCerts(ce);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" /></div>;
  if (!vessel) return <div className="page-wrapper"><span className="badge badge-red">Vessel not found</span></div>;

  const required = typeof vessel.required_manning === "object" && vessel.required_manning ? (vessel.required_manning as Record<string, unknown>).total as number || 0 : 0;
  const pct = required > 0 ? Math.min(100, Math.round((crew.length / required) * 100)) : 0;
  const certHealth = (crewId: string) => {
    const c = certs.filter(ce => ce.crew_id === crewId);
    if (!c.length) return 100;
    return Math.round(c.filter(ce => ce.status === "valid").length / c.length * 100);
  };
  const today = new Date();
  const daysLeft = (end: string) => Math.round((new Date(end).getTime() - today.getTime()) / 86400000);

  return (
    <div className="page-wrapper">
      <div className="flex items-center gap-2 mb-5" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
        <Link href="/vessels" className="hover:text-[var(--navy)]">Vessels</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{vessel.name}</span>
      </div>

      {/* Vessel Header */}
      <div className="card mb-5">
        <div style={{ height: "3px", background: "var(--red)" }} />
        <div className="card-body" style={{ padding: "1.5rem" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label mb-1">{vessel.vessel_type.replace(/_/g, " ").toUpperCase()}</p>
              <h1 className="page-title" style={{ fontSize: "1.75rem" }}>{vessel.name}</h1>
              <div className="flex gap-4 mt-2 flex-wrap" style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                <span>IMO: <strong style={{ color: "var(--text)" }}>{vessel.imo_number}</strong></span>
                <span>Flag: <strong style={{ color: "var(--text)" }}>{vessel.flag_state}</strong></span>
                <span>GT: <strong style={{ color: "var(--text)" }}>{vessel.gross_tonnage?.toLocaleString()}</strong></span>
                <span>Trading: <strong style={{ color: "var(--text)" }}>{vessel.trading_area}</strong></span>
              </div>
            </div>
            <span className={`badge ${vessel.status === "operational" ? "badge-teal" : vessel.status === "drydock" ? "badge-amber" : "badge-gray"}`} style={{ fontSize: "0.8125rem", padding: "0.375rem 0.875rem" }}>
              {vessel.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-5">
            {[["Home Port", vessel.home_port], ["Current Port", vessel.current_port], ["Vessel Type", vessel.vessel_type.replace(/_/g, " ")], ["Status", vessel.status]].map(([l, v]) => (
              <div key={l}>
                <div className="section-label mb-0.5">{l}</div>
                <div className="font-semibold capitalize text-sm" style={{ color: "var(--navy)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manning */}
      <div className="card mb-5">
        <div className="card-header">
          <div><p className="section-label">Complement</p><h2 className="card-title mt-0.5">Manning Status</h2></div>
          <span className={`font-black text-lg ${crew.length >= required ? "text-teal-600" : "text-amber-600"}`}>{crew.length} / {required}</span>
        </div>
        <div className="card-body">
          <div className="progress-bar" style={{ height: "8px" }}>
            <div className="progress-fill" style={{ width: `${pct}%`, height: "8px", background: pct >= 90 ? "var(--teal)" : "var(--amber)" }} />
          </div>
        </div>
      </div>

      {/* Crew Table */}
      <div className="card mb-5">
        <div className="card-header"><div><p className="section-label">On Board</p><h2 className="card-title mt-0.5">Current Crew ({crew.length})</h2></div></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Rank</th><th>Sign-off Date</th><th>Days Remaining</th><th>Cert Health</th></tr></thead>
            <tbody>
              {crew.map(cm => {
                const contract = contracts.find(c => c.crew_id === cm.id);
                const days = contract ? daysLeft(contract.end_date) : null;
                const health = certHealth(cm.id);
                return (
                  <tr key={cm.id}>
                    <td><Link href={`/crew-pool/${cm.id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{cm.full_name}</Link></td>
                    <td className="td-primary">{cm.rank}</td>
                    <td>{contract?.end_date || "—"}</td>
                    <td>{days !== null ? <span className="font-bold" style={{ color: days < 15 ? "var(--red)" : days < 30 ? "var(--amber)" : "var(--teal)" }}>{days}d</span> : "—"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16"><div className="progress-fill" style={{ width: `${health}%`, background: health >= 90 ? "var(--teal)" : health >= 70 ? "var(--amber)" : "var(--red)" }} /></div>
                        <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{health}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {changes.length > 0 && (
        <div className="card mb-5">
          <div className="card-header"><div><p className="section-label">Pending</p><h2 className="card-title mt-0.5">Upcoming Crew Changes</h2></div></div>
          <table className="data-table">
            <thead><tr><th>Rank</th><th>Port</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {changes.map((c, i) => (
                <tr key={i}>
                  <td className="td-primary">{c.rank}</td>
                  <td>{c.change_port}</td>
                  <td>{c.planned_date}</td>
                  <td><span className="badge badge-navy">{c.status.replace(/_/g, " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/rotation?vessel=${id}`} className="btn btn-primary">View Rotation Planner</Link>
        <Link href="/compliance" className="btn btn-teal">Compliance Center</Link>
      </div>
    </div>
  );
}
