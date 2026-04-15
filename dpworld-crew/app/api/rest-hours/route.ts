import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const logs = await readSheet("rest_hours_log.xlsx");
  return NextResponse.json(logs);
}
