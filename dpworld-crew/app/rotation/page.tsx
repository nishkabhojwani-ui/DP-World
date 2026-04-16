"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AIBadge from "@/components/AIBadge";

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
              {i < 4 ? <div style={{ width: 12, height: 8, borderRadius: 2, background: color as string }} /> : <div style={{ width: 2, height: 12, background: color as string, opacity: 0.5 }} />}
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
  const [viewMode, setViewMode] = useState<"gantt" | "coverage">("gantt");

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
  const activeContracts = contracts.filter(c => c.vessel_id === selectedVessel && c.status === "active");
  const upcomingRotations = activeContracts.filter(c => {
    const daysLeft = Math.round((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
    return daysLeft <= 30 && daysLeft > 0;
  }).sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());

  const criticalGaps = activeContracts.filter(c => {
    const daysLeft = Math.round((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
    return daysLeft < 7;
  });

  const crewUtilization = crew.length > 0 ? Math.round((activeContracts.length / crew.length) * 100) : 0;

  const rankCoverage: Record<string, number> = {};
  RANK_ORDER.forEach(rank => {
    rankCoverage[rank] = activeContracts.filter(c => c.rank_on_vessel === rank).length;
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Planning</p>
            <h1 className="page-title">Crew Rotation Planner</h1>
            <p className="page-subtitle">6-month AI-optimized timeline with gap prediction & rest hour forecasting</p>
            <div className="mt-2 flex gap-2">
              <AIBadge type="generated" size="sm" />
              <AIBadge type="flagged" size="sm" />
              <AIBadge type="detected" size="sm" />
            </div>
          </div>
          <Link href="/crew-changes" className="btn btn-danger">+ Create Crew Change</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Active Crew</div>
          <div className="text-3xl font-bold text-[var(--navy)] mt-2">{activeContracts.length}</div>
          <div className="text-xs text-[var(--muted)] mt-3">on board</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Crew Utilization</div>
          <div className="text-3xl font-bold text-[var(--teal)] mt-2">{crewUtilization}%</div>
          <div className="text-xs text-[var(--muted)] mt-3">pool usage</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Upcoming Rotations</div>
          <div className="text-3xl font-bold text-[var(--amber)] mt-2">{upcomingRotations.length}</div>
          <div className="text-xs text-[var(--muted)] mt-3">next 30 days</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Critical Gaps</div>
            <AIBadge type="detected" size="sm" />
          </div>
          <div className={`text-3xl font-bold mt-2 ${criticalGaps.length > 0 ? "text-red-600" : "text-teal-600"}`}>{criticalGaps.length}</div>
          <div className="text-xs text-[var(--muted)] mt-3">AI-predicted expiring &lt; 7d</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">Avg Duration</div>
          <div className="text-3xl font-bold text-[var(--navy)] mt-2">
            {activeContracts.length > 0
              ? Math.round(activeContracts.reduce((sum, c) => sum + (new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000, 0) / activeContracts.length)
              : 0}d
          </div>
          <div className="text-xs text-[var(--muted)] mt-3">per rotation</div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalGaps.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="font-semibold text-red-700 mb-2">Critical Crew Change Required</div>
          <div className="text-sm text-red-600 space-y-1">
            {criticalGaps.map((c, i) => {
              const crewMember = crew.find(cm => cm.id === c.crew_id);
              const days = Math.round((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
              return <div key={i}>{crewMember?.full_name} ({c.rank_on_vessel}) — sign-off in {days}d</div>;
            })}
          </div>
        </div>
      )}

      {/* Vessel Selector */}
      <div className="card mb-5">
        <div className="card-body flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <label className="section-label">Select Vessel</label>
            <select value={selectedVessel} onChange={e => setSelectedVessel(e.target.value)} className="input" style={{ minWidth: 240 }}>
              {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode("gantt")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "gantt" ? "bg-[var(--navy)] text-white" : "bg-[var(--light)] text-[var(--navy)]"}`}>
              Timeline
            </button>
            <button onClick={() => setViewMode("coverage")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "coverage" ? "bg-[var(--navy)] text-white" : "bg-[var(--light)] text-[var(--navy)]"}`}>
              Coverage Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart View */}
      {viewMode === "gantt" && (
        <div className="card mb-5">
          <div className="card-header">
            <div><p className="section-label">Timeline</p><h2 className="card-title mt-0.5">{vessel?.name || "Select a vessel"}</h2></div>
          </div>
          <div className="card-body">
            {selectedVessel && <GanttChart contracts={contracts} crew={crew} vesselId={selectedVessel} />}
          </div>
        </div>
      )}

      {/* Coverage Matrix View */}
      {viewMode === "coverage" && (
        <div className="card mb-5">
          <div className="card-header">
            <p className="section-label">Coverage</p>
            <h2 className="card-title mt-0.5">Rank Coverage — {vessel?.name}</h2>
          </div>
          <div className="card-body space-y-3">
            {RANK_ORDER.map(rank => {
              const count = rankCoverage[rank] || 0;
              const isRequired = ["Master","Chief Officer","Chief Engineer"].includes(rank);
              const target = isRequired ? 3 : 2;
              const pct = Math.min(100, (count / target) * 100);
              const barColor = count >= target - 1 ? "var(--teal)" : count >= 1 ? "var(--amber)" : "#D1D5DB";
              return (
                <div key={rank} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-[var(--navy)]">{rank}{isRequired ? " *" : ""}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-[var(--light)] rounded flex items-center px-2 relative">
                      <div className="h-6 rounded flex items-center justify-center text-xs font-bold text-white transition-all"
                        style={{ width: `${pct}%`, background: barColor }}>
                        {count > 0 && count}
                      </div>
                    </div>
                    <span className="w-10 text-right font-bold text-[var(--navy)]">{count}/{target}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${count >= target - 1 ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"}`}>
                      {count >= target - 1 ? "Staffed" : "Gap"}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-[var(--muted)] mt-4 pt-4 border-t border-[var(--border)]">* Required ranks need minimum 2 crew members on board at all times</div>
          </div>
        </div>
      )}

      {/* Upcoming Rotations Table */}
      {upcomingRotations.length > 0 && (
        <div className="card mb-5">
          <div className="card-header">
            <p className="section-label">Next 30 Days</p>
            <h2 className="card-title mt-0.5">Upcoming Crew Changes</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crew Member</th>
                  <th>Rank</th>
                  <th>Sign-off Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRotations.map(c => {
                  const crewMember = crew.find(cm => cm.id === c.crew_id);
                  const days = Math.round((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
                  return (
                    <tr key={c.id} className={days < 7 ? "bg-red-50" : ""}>
                      <td><Link href={`/crew-pool/${c.crew_id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{crewMember?.full_name || "—"}</Link></td>
                      <td className="td-primary">{c.rank_on_vessel}</td>
                      <td>{c.end_date}</td>
                      <td><span className="font-bold" style={{ color: blockColor(days) }}>{days}d</span></td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${days < 7 ? "bg-red-100 text-red-700" : days < 14 ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>
                          {days < 7 ? "Critical" : days < 14 ? "Urgent" : "Planned"}
                        </span>
                      </td>
                      <td>
                        <Link href="/crew-changes" className="text-xs font-medium text-[var(--navy)] hover:underline">Schedule</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Contracts Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="section-label">Current</p>
            <h2 className="card-title mt-0.5">Active Contracts — {vessel?.name}</h2>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Crew Member</th>
                <th>Rank</th>
                <th>Joined</th>
                <th>Sign-off</th>
                <th>Duration</th>
                <th>Rotation</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {activeContracts.map(c => {
                const crewMember = crew.find(cm => cm.id === c.crew_id);
                const days = Math.round((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
                const duration = Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000);
                return (
                  <tr key={c.id} className={days < 7 ? "bg-red-50 border-l-4 border-red-500" : ""}>
                    <td><Link href={`/crew-pool/${c.crew_id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>{crewMember?.full_name || "—"}</Link></td>
                    <td className="td-primary font-medium">{c.rank_on_vessel}</td>
                    <td className="text-[var(--muted)]">{c.start_date}</td>
                    <td className="font-medium">{c.end_date}</td>
                    <td className="text-[var(--muted)]">{duration}d</td>
                    <td><span className="badge badge-navy text-xs">{c.rotation_type}</span></td>
                    <td>
                      <span className="font-bold text-sm" style={{ color: blockColor(days) }}>
                        {days}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {activeContracts.length === 0 && (
            <div className="p-8 text-center text-[var(--muted)]">No active contracts for this vessel</div>
          )}
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
