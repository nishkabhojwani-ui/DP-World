import { NextResponse } from "next/server";
import { readSheet, insertRow } from "@/lib/excel";

export async function GET() {
  try {
    const reqs = await readSheet("recruitment_requisitions.xlsx");
    return NextResponse.json(reqs);
  } catch (err) {
    console.warn("Failed to read recruitment_requisitions.xlsx:", err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  await insertRow("recruitment_requisitions.xlsx", { id: crypto.randomUUID(), ...body });
  return NextResponse.json({ success: true });
}
