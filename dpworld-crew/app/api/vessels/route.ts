import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

const SAMPLE_VESSELS = [
  {"id":"38da2067-afe3-4aaa-b8b7-ad6e1ba08c98","name":"MV-Alpha"},
  {"id":"cd4e84a2-d089-4d2b-8812-d06a0c21f87d","name":"MV-Beta"},
  {"id":"0ba534db-ff49-4e83-904d-859105c472f4","name":"MV-Gamma"},
  {"id":"9945231d-2929-4251-b19a-73e3475ecdb1","name":"MV-Delta"},
  {"id":"5a9b98b4-f358-4660-b5cd-a240f58d67f1","name":"MV-Epsilon"},
  {"id":"aea31302-50fe-42c4-8537-234640af9161","name":"MV-Zeta"},
  {"id":"1b2e4376-d1d2-4e44-b85a-b8d8b97b9a7c","name":"MV-Eta"},
  {"id":"03291a37-fee5-4cc9-9faf-6c6cc9f4b03e","name":"MV-Theta"}
];

export async function GET() {
  try {
    const vessels = await readSheet("vessels.xlsx");
    if (vessels && vessels.length > 0) {
      return NextResponse.json(vessels);
    }
  } catch (err) {
    console.warn("Failed to read vessels.xlsx:", err);
  }
  return NextResponse.json(SAMPLE_VESSELS);
}
