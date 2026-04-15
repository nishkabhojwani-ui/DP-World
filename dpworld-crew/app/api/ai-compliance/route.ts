import { NextRequest, NextResponse } from "next/server";
import { runComplianceCheck } from "@/lib/ai";

export async function GET(request: NextRequest) {
  const crewId = request.nextUrl.searchParams.get("crewId");
  if (!crewId) return NextResponse.json({ error: "crewId required" }, { status: 400 });

  try {
    const result = await runComplianceCheck(crewId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
