import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

export async function GET() {
  try {
    const certs = await readSheet("certifications.xlsx");
    return NextResponse.json(certs);
  } catch (err) {
    console.warn("Failed to read certifications.xlsx:", err);
    return NextResponse.json([]);
  }
}
