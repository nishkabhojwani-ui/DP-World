"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface KPIs { crewOnBoard: number; certAlerts: number; activeChanges: number; restViolations: number; }
interface DashboardData {
  kpis: KPIs;
  expiredOnboard: Record<string, unknown>[];
  changesThisWeek: Record<string, unknown>[];
  fleetStatus: Record<string, unknown>[];
}

function StageBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    planned: "badge-gray", docs_check: "badge-navy", travel_arranged: "badge-navy",
    in_transit: "badge-amber", signed_on: "badge-teal", completed: "badge-green",
  };
  return <span className={`badge ${map[status] || "badge-gray"}`}>{status.replace(/_/g, " ")}</span>;
}

function ComplianceBadge({ status }: { status: string }) {
  const map: Record<string, string> = { green: "badge-teal", amber: "badge-amber", red: "badge-red" };
  const labels: Record<string, string> = { green: "Compliant", amber: "At Risk", red: "Non-Compliant" };
  return <span className={`badge ${map[status] || "badge-gray"}`}>{labels[status] || "Unknown"}</span>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading fleet data…</div>
      </div>
    </div>
  );

  const { kpis, expiredOnboard, changesThisWeek, fleetStatus } = data!;

  return (
    <div className="page-wrapper">

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Overview</p>
            <h1 className="page-title">Fleet Dashboard</h1>
            <p className="page-subtitle">Real-time crew operations across the DP World fleet</p>
          </div>
          <div className="flex gap-2">
            <Link href="/crew-pool?status=available" className="btn btn-ghost btn-sm">Available Crew</Link>
            <Link href="/crew-changes" className="btn btn-danger btn-sm">+ Crew Change</Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-label">Crew On Board</div>
          <div className="kpi-value mt-2">{kpis.crewOnBoard}</div>
          <div className="kpi-sub">Active SEA contracts</div>
        </div>
        <div className={`kpi-card ${kpis.certAlerts > 0 ? "alert" : ""}`}>
          <div className="kpi-label">Cert Alerts</div>
          <div className={`kpi-value mt-2 ${kpis.certAlerts > 0 ? "text-red-600" : ""}`}>{kpis.certAlerts}</div>
          <div className="kpi-sub">Expiring or expired (&lt;60d)</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-label">Active Crew Changes</div>
          <div className="kpi-value mt-2">{kpis.activeChanges}</div>
          <div className="kpi-sub">In-progress</div>
        </div>
        <div className={`kpi-card ${kpis.restViolations > 0 ? "alert" : "success"}`}>
          <div className="kpi-label">Rest Hour Violations</div>
          <div className={`kpi-value mt-2 ${kpis.restViolations > 0 ? "text-red-600" : "text-teal-600"}`}>{kpis.restViolations}</div>
          <div className="kpi-sub">This month</div>
        </div>
      </div>

      {/* Alert Banner */}
      {expiredOnboard.length > 0 && (
        <div className="alert-banner error mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Expired Certificates — Active Crew</span>
            <span className="badge badge-red">{expiredOnboard.length} alerts</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {expiredOnboard.slice(0, 6).map((cert, i) => (
              <div key={i} className="text-xs flex items-center gap-2" style={{ color: "#C53030" }}>
                <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                <strong>{String(cert.cert_type)}</strong> — expired {String(cert.expiry_date)}
              </div>
            ))}
          </div>
          {expiredOnboard.length > 6 && (
            <div className="text-xs mt-1" style={{ color: "#C53030", opacity: 0.7 }}>+{expiredOnboard.length - 6} more</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Crew Changes Due This Week */}
        <div className="card col-span-2">
          <div className="card-header">
            <div>
              <p className="section-label">This Week</p>
              <h2 className="card-title mt-0.5">Crew Changes Due</h2>
            </div>
            <Link href="/crew-changes" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {changesThisWeek.length === 0 ? (
            <div className="card-body">
              <svg viewBox="0 0 400 200" style={{ width: "100%", height: "200px" }}>
                {/* Y-axis */}
                <line x1="40" y1="20" x2="40" y2="180" stroke="#D1E0F0" strokeWidth="2" />
                {/* X-axis */}
                <line x1="40" y1="180" x2="390" y2="180" stroke="#D1E0F0" strokeWidth="2" />

                {/* Y-axis labels */}
                {[0, 5, 10, 15, 20].map((num, i) => (
                  <text key={`y-${i}`} x="25" y={180 - (i * 40)} fontSize="12" fill="#003D7A" textAnchor="end">
                    {num}
                  </text>
                ))}

                {/* Grid lines */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <line key={`grid-${i}`} x1="40" y1={180 - (i * 40)} x2="390" y2={180 - (i * 40)} stroke="#E8F1F8" strokeWidth="1" strokeDasharray="2,2" />
                ))}

                {/* Sample bars - Crew Status Data */}
                {[
                  { label: "Onboard", value: 18, color: "#00A19A" },
                  { label: "On Leave", value: 12, color: "#FFA500" },
                  { label: "Training", value: 8, color: "#003D7A" },
                  { label: "Available", value: 15, color: "#E5341A" },
                ].map((item, i) => {
                  const barWidth = 60;
                  const barX = 60 + (i * 85);
                  const barHeight = (item.value / 20) * 160;
                  return (
                    <g key={i}>
                      <rect x={barX} y={180 - barHeight} width={barWidth} height={barHeight} fill={item.color} opacity="0.8" rx="4" />
                      <text x={barX + barWidth / 2} y="200" fontSize="12" fill="#003D7A" textAnchor="middle" fontWeight="500">
                        {item.label}
                      </text>
                      <text x={barX + barWidth / 2} y={180 - barHeight - 5} fontSize="12" fill="#003D7A" textAnchor="middle" fontWeight="bold">
                        {item.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th><th>Port</th><th>Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {changesThisWeek.map((cc, i) => (
                  <tr key={i}>
                    <td className="td-primary">{String(cc.rank)}</td>
                    <td>{String(cc.change_port)}</td>
                    <td>{String(cc.planned_date)}</td>
                    <td><StageBadge status={String(cc.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="section-label">Shortcuts</p>
              <h2 className="card-title mt-0.5">Quick Actions</h2>
            </div>
          </div>
          <div className="card-body space-y-2">
            {[
              { href: "/crew-changes", label: "Plan New Crew Change", sub: "Initiate rotation workflow", color: "var(--navy)" },
              { href: "/crew-pool?status=available", label: "Search Available Crew", sub: "Browse by availability", color: "var(--teal)" },
              { href: "/compliance", label: "Fleet Compliance Check", sub: "Cert matrix & rest hours", color: "var(--amber)" },
              { href: "/recruitment", label: "Open Requisitions", sub: "View recruitment pipeline", color: "var(--red)" },
            ].map(({ href, label, sub, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-[var(--bg)]"
              >
                <div className="w-7 h-7 rounded flex-shrink-0" style={{ background: color, opacity: 0.9 }} />
                <div>
                  <div className="font-semibold text-xs" style={{ color: "var(--navy)" }}>{label}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Status Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="section-label">All Vessels</p>
            <h2 className="card-title mt-0.5">Fleet Status</h2>
          </div>
          <Link href="/vessels" className="btn btn-ghost btn-sm">View vessels</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Vessel</th><th>Type</th><th>Port</th><th>Manning</th><th>Status</th><th>Compliance</th></tr>
            </thead>
            <tbody>
              {fleetStatus.map((v, i) => {
                const manning = typeof v.required_manning === "object" && v.required_manning
                  ? (v.required_manning as Record<string, unknown>).total as number : 0;
                const onboard = (v.onboard_count as number) || 0;
                const pct = manning > 0 ? Math.min(100, Math.round((onboard / manning) * 100)) : 0;
                return (
                  <tr key={i}>
                    <td>
                      <Link href={`/vessels/${v.id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>
                        {String(v.name)}
                      </Link>
                    </td>
                    <td className="capitalize">{String(v.vessel_type).replace(/_/g, " ")}</td>
                    <td>{String(v.current_port)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${pct < 90 ? "text-amber-600" : "text-teal-600"}`}>{onboard}/{manning}</span>
                        <div className="progress-bar w-16">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? "var(--teal)" : "var(--amber)" }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${v.status === "operational" ? "badge-teal" : v.status === "drydock" ? "badge-amber" : "badge-gray"}`}>
                        {String(v.status)}
                      </span>
                    </td>
                    <td><ComplianceBadge status={String(v.compliance_status)} /></td>
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
