import { NextResponse } from "next/server";
import { listComplianceRuns } from "@/lib/compliance";

export async function GET() {
  const runs = await listComplianceRuns();
  return NextResponse.json(runs);
}
