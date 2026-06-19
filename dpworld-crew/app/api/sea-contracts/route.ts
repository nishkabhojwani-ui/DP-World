import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  try {
    const contracts = await readSheet("sea_contracts.xlsx");
    return NextResponse.json(contracts);
  } catch (err) {
    console.warn("Failed to read sea_contracts.xlsx:", err);
    return NextResponse.json([]);
  }
}
