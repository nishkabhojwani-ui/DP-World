import { NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/excel";

export async function GET() {
  const candidates = await readSheet("candidates.xlsx");
  return NextResponse.json(candidates);
}

export async function PATCH(request: Request) {
  const { id, ...updates } = await request.json();
  await updateRow("candidates.xlsx", id, updates);
  return NextResponse.json({ success: true });
}
