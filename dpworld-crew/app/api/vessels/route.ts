import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const vessels = await readSheet("vessels.xlsx");
  return NextResponse.json(vessels);
}
