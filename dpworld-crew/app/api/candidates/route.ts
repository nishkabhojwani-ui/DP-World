import { NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/excel";

export async function GET() {
  try {
    const candidates = await readSheet("candidates.xlsx");
    return NextResponse.json(candidates);
  } catch (err) {
    console.warn("Failed to read candidates.xlsx:", err);
    return NextResponse.json([]);
  }
}

export async function PATCH(request: Request) {
  const { id, ...updates } = await request.json();
  await updateRow("candidates.xlsx", id, updates);
  return NextResponse.json({ success: true });
}
