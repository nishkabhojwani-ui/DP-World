import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  try {
    const checklists = await readSheet("pre_joining_checklists.xlsx");
    return NextResponse.json(checklists);
  } catch (err) {
    console.warn("Failed to read pre_joining_checklists.xlsx:", err);
    return NextResponse.json([]);
  }
}
