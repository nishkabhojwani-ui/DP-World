import { NextResponse } from "next/server";
import { readSheet } from "@/lib/excel";

const SAMPLE_CREW = [
  {"id":"1c5dfefa-883f-463f-8ec4-919121f66730","full_name":"Jose Santos","rank":"Master"},
  {"id":"3a5723a6-2cd4-4d22-8ecf-070b982d8a31","full_name":"Eduardo Reyes","rank":"Master"},
  {"id":"6711b357-6d09-47ea-8917-2bf1cdaf1eac","full_name":"Roberto Cruz","rank":"Chief Officer"},
  {"id":"db028595-1763-4662-98fc-b97ae082cfac","full_name":"Antonio Garcia","rank":"Chief Officer"},
  {"id":"284d7560-1b9e-4bf5-a969-80779d750283","full_name":"Miguel Santos","rank":"2nd Officer"},
  {"id":"5333307e-41ab-409b-9512-9058b36db6ff","full_name":"Carlos Mendez","rank":"2nd Officer"},
  {"id":"b649e8ea-c13e-4098-a062-db00e59ec4c5","full_name":"Juan Delgado","rank":"3rd Officer"},
  {"id":"487997bf-389d-413f-a849-93197f1c1b8c","full_name":"Diego Lopez","rank":"3rd Officer"},
  {"id":"ff7d2d77-95c2-4cfc-9b92-106d69a688a1","full_name":"Ahmed Hassan","rank":"Chief Officer"},
  {"id":"a7015549-6201-4d25-bb1d-9fb8f088ac7f","full_name":"Hassan Saleh","rank":"2nd Officer"},
  {"id":"52bffd8e-32c5-4fee-b30c-dfdf43062ca2","full_name":"Omar Khalid","rank":"3rd Officer"},
  {"id":"f18da2d7-b2a3-45e8-9379-5681941c75a2","full_name":"Fatima Ahmed","rank":"Chief Officer"}
];

export async function GET() {
  try {
    const crew = await readSheet("crew_members.xlsx");
    if (crew && crew.length > 0) {
      return NextResponse.json(crew);
    }
  } catch (err) {
    console.warn("Failed to read crew_members.xlsx:", err);
  }
  return NextResponse.json(SAMPLE_CREW);
}
