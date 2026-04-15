import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const [crew, contracts, changes, certs, vessels, restLogs] = await Promise.all([
    readSheet<Record<string,unknown>>("crew_members.xlsx"),
    readSheet<Record<string,unknown>>("sea_contracts.xlsx"),
    readSheet<Record<string,unknown>>("crew_changes.xlsx"),
    readSheet<Record<string,unknown>>("certifications.xlsx"),
    readSheet<Record<string,unknown>>("vessels.xlsx"),
    readSheet<Record<string,unknown>>("rest_hours_log.xlsx"),
  ]);

  const today = new Date();

  // Total crew on board (active contracts)
  const crewOnBoard = contracts.filter(c => c.status === "active").length;

  // Cert alerts: expiring within 60 days
  const in60Days = new Date(today);
  in60Days.setDate(in60Days.getDate() + 60);
  const certAlerts = certs.filter(c => {
    if (c.status === "expired") return true;
    if (c.status === "expiring") return true;
    if (c.expiry_date) {
      const exp = new Date(String(c.expiry_date));
      return exp <= in60Days && exp >= today;
    }
    return false;
  }).length;

  // Active crew changes
  const activeChanges = changes.filter(c => c.status !== "completed").length;

  // Rest hour violations this month
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const restViolations = restLogs.filter(r => {
    if (r.violation_flag !== "true") return false;
    const d = new Date(String(r.log_date));
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Expired certs for onboard crew
  const onboardIds = new Set(crew.filter(c => c.status === "onboard").map(c => c.id));
  const expiredOnboard = certs.filter(c => c.status === "expired" && onboardIds.has(c.crew_id));

  // Crew changes due this week
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const changesThisWeek = changes.filter(c => {
    const d = new Date(String(c.planned_date));
    return d >= today && d <= in7Days && c.status !== "completed";
  });

  // Fleet status per vessel
  const fleetStatus = vessels.map(v => {
    const onboardCount = contracts.filter(c => c.vessel_id === v.id && c.status === "active").length;
    const vesselCrewIds = crew.filter(c => c.current_vessel_id === v.id).map(c => c.id);
    const vesselCerts = certs.filter(c => vesselCrewIds.includes(c.crew_id));
    const expiredCount = vesselCerts.filter(c => c.status === "expired").length;
    const expiringCount = vesselCerts.filter(c => c.status === "expiring").length;
    const complianceStatus = expiredCount > 0 ? "red" : expiringCount > 2 ? "amber" : "green";
    return {
      ...v,
      onboard_count: onboardCount,
      compliance_status: complianceStatus,
    };
  });

  return NextResponse.json({
    kpis: { crewOnBoard, certAlerts, activeChanges, restViolations },
    expiredOnboard,
    changesThisWeek,
    fleetStatus,
  });
}
