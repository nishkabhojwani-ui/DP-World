import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  try {
    const logs = await readSheet("rest_hours_log.xlsx");
    return NextResponse.json(logs);
  } catch (err) {
    console.warn("Failed to read rest_hours_log.xlsx:", err);
    return NextResponse.json([]);
  }
}
