import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const contracts = await readSheet("sea_contracts.xlsx");
  return NextResponse.json(contracts);
}
