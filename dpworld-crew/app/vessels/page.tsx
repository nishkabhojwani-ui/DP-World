"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Vessel { id: string; name: string; vessel_type: string; flag_state: string; current_port: string; status: string; gross_tonnage: number; required_manning: unknown; imo_number: string; trading_area: string; }
interface Contract { vessel_id: string; status: string; }
interface Cert { crew_id: string; status: string; }
interface CrewMember { id: string; current_vessel_id: string | null; }

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/vessels").then(r => r.json()),
      fetch("/api/sea-contracts").then(r => r.json()),
      fetch("/api/certifications").then(r => r.json()),
      fetch("/api/crew").then(r => r.json()),
    ]).then(([v, c, ce, cm]) => { setVessels(v); setContracts(c); setCerts(ce); setCrewMembers(cm); setLoading(false); });
  }, []);

  const vesselStats = (v: Vessel) => {
    const onboard = contracts.filter(c => c.vessel_id === v.id && c.status === "active").length;
    const required = typeof v.required_manning === "object" && v.required_manning ? (v.required_manning as Record<string, unknown>).total as number || 0 : 0;
    const vesselCrewIds = crewMembers.filter(c => c.current_vessel_id === v.id).map(c => c.id);
    const vesselCerts = certs.filter(c => vesselCrewIds.includes(c.crew_id));
    const expired = vesselCerts.filter(c => c.status === "expired").length;
    const expiring = vesselCerts.filter(c => c.status === "expiring").length;
    const compliance = expired > 0 ? "red" : expiring > 2 ? "amber" : "green";
    const pct = required > 0 ? Math.min(100, Math.round((onboard / required) * 100)) : 0;
    return { onboard, required, compliance, pct };
  };

  const types = Array.from(new Set(vessels.map(v => v.vessel_type)));
  const filtered = filter ? vessels.filter(v => v.vessel_type === filter) : vessels;

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Fleet</p>
            <h1 className="page-title">Vessel Management</h1>
            <p className="page-subtitle">{vessels.length} vessels across the DP World fleet</p>
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded text-xs font-bold tracking-wide uppercase transition-colors border ${filter === "" ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--bg)]"}`}>
          All ({vessels.length})
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(filter === t ? "" : t)}
            className={`px-3 py-1.5 rounded text-xs font-bold tracking-wide uppercase transition-colors border capitalize ${filter === t ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--bg)]"}`}>
            {t.replace(/_/g, " ")} ({vessels.filter(v => v.vessel_type === t).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map(v => {
          const { onboard, required, compliance, pct } = vesselStats(v);
          return (
            <Link key={v.id} href={`/vessels/${v.id}`} className="card hover:shadow-md transition-shadow block">
              {/* Accent bar */}
              <div style={{ height: "3px", background: compliance === "green" ? "var(--teal)" : compliance === "amber" ? "var(--amber)" : "var(--red)" }} />
              <div className="card-body" style={{ padding: "1.25rem" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: "var(--navy)" }}>{v.name}</h3>
                    <div className="text-xs mt-0.5 capitalize" style={{ color: "var(--muted)" }}>
                      {v.vessel_type.replace(/_/g, " ")} · {v.flag_state}
                    </div>
                  </div>
                  <span className={`badge ${v.status === "operational" ? "badge-teal" : v.status === "drydock" ? "badge-amber" : "badge-gray"}`}>
                    {v.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between" style={{ color: "var(--muted)" }}>
                    <span>{v.current_port}</span>
                    <span style={{ fontFamily: "monospace" }}>{v.imo_number}</span>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: "var(--muted)" }}>Manning</span>
                      <span className="font-bold" style={{ color: pct < 90 ? "var(--amber)" : "var(--teal)" }}>{onboard}/{required}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? "var(--teal)" : "var(--amber)" }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span style={{ color: "var(--muted)" }}>Compliance</span>
                    <span className={`badge ${compliance === "green" ? "badge-teal" : compliance === "amber" ? "badge-amber" : "badge-red"}`}>
                      {compliance === "green" ? "Compliant" : compliance === "amber" ? "At Risk" : "Non-Compliant"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
