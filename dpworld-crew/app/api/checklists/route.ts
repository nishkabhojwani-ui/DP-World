import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const checklists = await readSheet("pre_joining_checklists.xlsx");
  return NextResponse.json(checklists);
}
