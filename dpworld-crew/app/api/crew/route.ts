import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const crew = await readSheet("crew_members.xlsx");
  return NextResponse.json(crew);
}
