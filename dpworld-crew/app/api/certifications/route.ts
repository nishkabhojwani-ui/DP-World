import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  const certs = await readSheet("certifications.xlsx");
  return NextResponse.json(certs);
}
