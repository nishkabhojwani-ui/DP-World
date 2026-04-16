"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AIBadge from "@/components/AIBadge";

interface CrewMember {
  id: string; full_name: string; rank: string; rank_category: string;
  nationality: string; status: string; current_vessel_id: string | null;
  next_available_date: string;
}
interface Cert { crew_id: string; status: string; }

const STATUS_BADGE: Record<string, string> = {
  onboard: "badge-onboard", available: "badge-available",
  leave: "badge-leave", training: "badge-training", inactive: "badge-inactive",
};

export default function CrewPoolPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [filterRank, setFilterRank] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNat, setFilterNat] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/crew").then(r => r.json()), fetch("/api/certifications").then(r => r.json())])
      .then(([c, ce]) => { setCrew(c); setCerts(ce); setLoading(false); });
  }, []);

  const certHealth = (crewId: string) => {
    const c = certs.filter(x => x.crew_id === crewId);
    if (!c.length) return 100;
    return Math.round(c.filter(x => x.status === "valid").length / c.length * 100);
  };

  const ranks = Array.from(new Set(crew.map(c => c.rank))).sort();
  const nationalities = Array.from(new Set(crew.map(c => c.nationality))).sort();
  const statuses = ["onboard", "available", "leave", "training", "inactive"];

  const filtered = crew.filter(c => {
    if (filterRank && c.rank !== filterRank) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterNat && c.nationality !== filterNat) return false;
    if (search && !c.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Seafarers</p>
            <h1 className="page-title">Crew Pool</h1>
            <p className="page-subtitle">{filtered.length} of {crew.length} crew members • AI-powered readiness scoring & cert expiry predictions</p>
            <div className="mt-2 flex gap-2">
              <AIBadge type="analyzed" size="sm" />
              <AIBadge type="flagged" size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilterStatus("")}
          className={`px-3 py-1.5 rounded text-xs font-bold tracking-wide uppercase transition-colors border ${filterStatus === "" ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--bg)]"}`}>
          All ({crew.length})
        </button>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`px-3 py-1.5 rounded text-xs font-bold tracking-wide uppercase transition-colors border ${filterStatus === s ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--bg)]"}`}>
            {s} ({crew.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="card-body flex gap-3 flex-wrap" style={{ padding: "0.875rem 1.25rem" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…" className="input flex-1 min-w-48" />
          <select value={filterRank} onChange={e => setFilterRank(e.target.value)} className="input">
            <option value="">All Ranks</option>
            {ranks.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterNat} onChange={e => setFilterNat(e.target.value)} className="input">
            <option value="">All Nationalities</option>
            {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {(search || filterRank || filterStatus || filterNat) && (
            <button onClick={() => { setSearch(""); setFilterRank(""); setFilterStatus(""); setFilterNat(""); }}
              className="btn btn-ghost btn-sm">Clear filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Rank</th><th>Category</th><th>Nationality</th>
                <th>Status</th><th>Next Available</th><th>Cert Health</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const health = certHealth(c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/crew-pool/${c.id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="td-primary">{c.rank}</td>
                    <td className="capitalize">{c.rank_category}</td>
                    <td>{c.nationality}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.status] || "badge-gray"}`}>{c.status}</span></td>
                    <td>{c.next_available_date || "—"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-20">
                          <div className="progress-fill" style={{
                            width: `${health}%`,
                            background: health >= 90 ? "var(--teal)" : health >= 70 ? "var(--amber)" : "var(--red)"
                          }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: health >= 90 ? "var(--teal)" : health >= 70 ? "var(--amber)" : "var(--red)" }}>
                          {health}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <Link href={`/crew-pool/${c.id}`} className="btn btn-primary btn-sm">Profile</Link>
                    </td>
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
