import { NextResponse } from "next/server";
import { readSheet, insertRow } from "@/lib/excel";

export async function GET() {
  const reqs = await readSheet("recruitment_requisitions.xlsx");
  return NextResponse.json(reqs);
}

export async function POST(request: Request) {
  const body = await request.json();
  await insertRow("recruitment_requisitions.xlsx", { id: crypto.randomUUID(), ...body });
  return NextResponse.json({ success: true });
}
