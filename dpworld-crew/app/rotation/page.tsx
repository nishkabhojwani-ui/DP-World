"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Vessel { id: string; name: string; }
interface Contract { id: string; crew_id: string; vessel_id: string; rank_on_vessel: string; start_date: string; end_date: string; rotation_type: string; status: string; }
interface CrewMember { id: string; full_name: string; rank: string; nationality: string; }

const RANK_ORDER = ["Master","Chief Officer","2nd Officer","3rd Officer","Chief Engineer","2nd Engineer","3rd Engineer","Bosun","AB","Oiler","Cook","Electrician","Pumpman"];

function blockColor(daysLeft: number) {
  if (daysLeft < 0) return "#94A3B8";
  if (daysLeft < 15) return "var(--red)";
  if (daysLeft < 30) return "var(--amber)";
  return "var(--teal)";
}

function GanttChart({ contracts, crew, vesselId }: { contracts: Contract[]; crew: CrewMember[]; vesselId: string }) {
  const today = new Date();
  const startDate = new Date(today); startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date(today); endDate.setDate(endDate.getDate() + 150);
  const totalDays = (endDate.getTime() - startDate.getTime()) / 86400000;

  const vesselContracts = contracts.filter(c => c.vessel_id === vesselId);
  const posOf = (d: string) => Math.max(0, Math.min(100, ((new Date(d).getTime() - startDate.getTime()) / 86400000 / totalDays) * 100));
  const widthOf = (s: string, e: string) => {
    const start = Math.max(new Date(s).getTime(), startDate.getTime());
    const end = Math.min(new Date(e).getTime(), endDate.getTime());
    return Math.max(0.5, ((end - start) / 86400000 / totalDays) * 100);
  };
  const daysLeft = (end: string) => Math.round((new Date(end).getTime() - today.getTime()) / 86400000);
  const todayPct = ((today.getTime() - startDate.getTime()) / 86400000 / totalDays) * 100;

  const byRank: Record<string, Contract[]> = {};
  vesselContracts.forEach(c => { if (!byRank[c.rank_on_vessel]) byRank[c.rank_on_vessel] = []; byRank[c.rank_on_vessel].push(c); });
  const ranks = RANK_ORDER.filter(r => byRank[r]);

  const months: { label: string; pct: number }[] = [];
  const m = new Date(startDate); m.setDate(1); m.setMonth(m.getMonth() + 1);
  while (m <= endDate) {
    months.push({ label: m.toLocaleString("default", { month: "short", year: "2-digit" }), pct: posOf(m.toISOString().split("T")[0]) });
    m.setMonth(m.getMonth() + 1);
  }

  if (!ranks.length) return <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: "0.875rem" }}>No active contracts for this vessel.</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 900 }}>
        {/* Month header */}
        <div style={{ display: "flex", paddingLeft: 152, marginBottom: 8, position: "relative", height: 20 }}>
          {months.map((m, i) => (
            <div key={i} style={{ position: "absolute", left: `calc(152px + ${m.pct}%)`, fontSize: "0.6875rem", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em" }}>{m.label}</div>
          ))}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(152px + ${todayPct}%)`, width: 1, background: "var(--red)", opacity: 0.5 }} />
        </div>

        {ranks.map(rank => (
          <div key={rank} style={{ display: "flex", alignItems: "center", marginBottom: 6, height: 36 }}>
            <div style={{ width: 144, flexShrink: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", textAlign: "right", paddingRight: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rank}</div>
            <div style={{ flex: 1, position: "relative", height: 28, background: "var(--bg)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${todayPct}%`, width: 1, background: "var(--red)", opacity: 0.4, zIndex: 10 }} />
              {byRank[rank]?.map(c => {
                const crewMember = crew.find(cm => cm.id === c.crew_id);
                const days = daysLeft(c.end_date);
                return (
                  <div key={c.id}
                    style={{ position: "absolute", top: 3, bottom: 3, left: `${posOf(c.start_date)}%`, width: `${widthOf(c.start_date, c.end_date)}%`, background: blockColor(days), borderRadius: 4, display: "flex", alignItems: "center", padding: "0 8px", overflow: "hidden", cursor: "default" }}
                    title={`${crewMember?.full_name || "?"} — ${c.start_date} to ${c.end_date} (${days}d remaining)`}>
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {crewMember?.full_name?.split(" ")[0] || "?"} · {c.rotation_type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 16, paddingLeft: 152, marginTop: 12 }}>
          {[["var(--teal)", ">30d"], ["var(--amber)", "15-30d"], ["var(--red)", "<15d"], ["#94A3B8", "Ended"], ["var(--red)", "Today"]].map(([color, label], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", color: "var(--muted)" }}>
              {i < 4 ? <div style={{ width: 12, height: 8, borderRadius: 2, background: color }} /> : <div style={{ width: 2, height: 12, background: color, opacity: 0.5 }} />}
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RotationContent() {
  const searchParams = useSearchParams();
  const vesselParam = searchParams.get("vessel");
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedVessel, setSelectedVessel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/vessels").then(r => r.json()),
      fetch("/api/sea-contracts").then(r => r.json()),
      fetch("/api/crew").then(r => r.json()),
    ]).then(([v, c, cm]) => {
      setVessels(v); setContracts(c); setCrew(cm);
      setSelectedVessel(vesselParam || v[0]?.id || "");
      setLoading(false);
    });
  }, [vesselParam]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" /></div>;

  const vessel = vessels.find(v => v.id === selectedVessel);
  const today = new Date();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Planning</p>
            <h1 className="page-title">Crew Rotation Planner</h1>
            <p className="page-subtitle">6-month Gantt timeline — 30 days past to 5 months ahead</p>
          </div>
          <Link href="/crew-changes" className="btn btn-danger">+ Create Crew Change</Link>
        </div>
      </div>

      {/* Vessel Selector */}
      <div className="card mb-5">
        <div className="card-body flex items-center gap-4" style={{ padding: "0.875rem 1.25rem" }}>
          <label className="section-label">Vessel</label>
          <select value={selectedVessel} onChange={e => setSelectedVessel(e.target.value)} className="input" style={{ minWidth: 240 }}>
            {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {vessel && (
            <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
              {contracts.filter(c => c.vessel_id === selectedVessel && c.status === "active").length} active contracts
            </span>
          )}
        </div>
      </div>

      {/* Gantt */}
      <div className="card mb-5">
        <div className="card-header">
          <div><p className="section-label">Timeline</p><h2 className="card-title mt-0.5">{vessel?.name || "Select a vessel"}</h2></div>
        </div>
        <div className="card-body">
          {selectedVessel && <GanttChart contracts={contracts} crew={crew} vesselId={selectedVessel} />}
        </div>
      </div>

      {/* Contract Table */}
      <div className="card">
        <div className="card-header"><div><p className="section-label">Active Contracts</p><h2 className="card-title mt-0.5">{vessel?.name}</h2></div></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Crew Member</th><th>Rank</th><th>Start</th><th>Sign-off</th><th>Rotation</th><th>Days Left</th></tr></thead>
            <tbody>
              {contracts.filter(c => c.vessel_id === selectedVessel && c.status === "active").map(c => {
                const crewMember = crew.find(cm => cm.id === c.crew_id);
                const days = Math.round((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
                return (
                  <tr key={c.id}>
                    <td><Link href={`/crew-pool/${c.crew_id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{crewMember?.full_name || "—"}</Link></td>
                    <td className="td-primary">{c.rank_on_vessel}</td>
                    <td>{c.start_date}</td>
                    <td>{c.end_date}</td>
                    <td><span className="badge badge-navy">{c.rotation_type}</span></td>
                    <td><span className="font-black" style={{ color: blockColor(days) }}>{days}d</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RotationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" /></div>}>
      <RotationContent />
    </Suspense>
  );
}
