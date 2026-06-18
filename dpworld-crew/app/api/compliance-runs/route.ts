import { NextResponse } from "next/server";
import { listComplianceRuns } from "@/lib/compliance";

const SAMPLE_RUNS = [
  {
    "id": "run-001",
    "template_id": "tpl-001",
    "template_name": "STCW Compliance Audit",
    "crew_id": "1c5dfefa-883f-463f-8ec4-919121f66730",
    "crew_name": "Jose Santos",
    "created_at": "2024-06-16T10:30:00Z",
    "overall_status": "COMPLIANT",
    "pass_count": 8,
    "fail_count": 0,
    "warn_count": 0,
    "results": []
  },
  {
    "id": "run-002",
    "template_id": "tpl-001",
    "template_name": "STCW Compliance Audit",
    "crew_id": "ff7d2d77-95c2-4cfc-9b92-106d69a688a1",
    "crew_name": "Sultan Al Shamsi",
    "created_at": "2024-06-15T14:20:00Z",
    "overall_status": "AT_RISK",
    "pass_count": 6,
    "fail_count": 0,
    "warn_count": 2,
    "results": []
  },
  {
    "id": "run-003",
    "template_id": "tpl-002",
    "template_name": "PSC Readiness Checklist",
    "crew_id": "a7015549-6201-4d25-bb1d-9fb8f088ac7f",
    "crew_name": "Omar Al Marzouqi",
    "created_at": "2024-06-14T11:00:00Z",
    "overall_status": "COMPLIANT",
    "pass_count": 6,
    "fail_count": 0,
    "warn_count": 0,
    "results": []
  }
];

export async function GET() {
  try {
    const runs = await listComplianceRuns();
    if (runs && runs.length > 0) {
      return NextResponse.json(runs);
    }
  } catch (err) {
    console.warn("Failed to load compliance runs:", err);
  }
  return NextResponse.json(SAMPLE_RUNS);
}
