import { NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/excel";

export async function GET() {
  const changes = await readSheet("crew_changes.xlsx");
  return NextResponse.json(changes);
}

export async function PATCH(request: Request) {
  const { id, ...updates } = await request.json();
  await updateRow("crew_changes.xlsx", id, updates);
  return NextResponse.json({ success: true });
}
