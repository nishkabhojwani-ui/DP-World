import { NextRequest, NextResponse } from "next/server";
import { createComplianceTemplate } from "@/lib/compliance";

const SAMPLE_TEMPLATES = [
  {
    "id": "tpl-001",
    "name": "STCW Compliance Audit",
    "source_file_name": "STCW_Requirements_2024.pdf",
    "source_type": "PDF",
    "created_at": "2024-06-15T10:30:00Z",
    "items": [
      {"id": "item-1", "category": "Certifications", "item": "Certificate of Competency valid for rank", "mandatory": true},
      {"id": "item-2", "category": "Certifications", "item": "GMDSS certification current", "mandatory": true},
      {"id": "item-3", "category": "Certifications", "item": "STCW Basic Safety Training valid", "mandatory": true},
      {"id": "item-4", "category": "Medical", "item": "Medical ENG1 certification valid", "mandatory": true},
      {"id": "item-5", "category": "Medical", "item": "Yellow fever vaccination current", "mandatory": false},
      {"id": "item-6", "category": "Documentation", "item": "Seaman's book valid", "mandatory": true},
      {"id": "item-7", "category": "Documentation", "item": "Passport validity 6+ months", "mandatory": true},
      {"id": "item-8", "category": "Rest Hours", "item": "STCW rest hour compliance logged", "mandatory": true}
    ]
  },
  {
    "id": "tpl-002",
    "name": "PSC Readiness Checklist",
    "source_file_name": "PSC_Readiness_2024.pdf",
    "source_type": "PDF",
    "created_at": "2024-06-14T14:15:00Z",
    "items": [
      {"id": "item-9", "category": "Safety Equipment", "item": "Life jackets for all crew", "mandatory": true},
      {"id": "item-10", "category": "Safety Equipment", "item": "Lifeboat equipment inspected", "mandatory": true},
      {"id": "item-11", "category": "Records", "item": "Oil record book current", "mandatory": true},
      {"id": "item-12", "category": "Records", "item": "Accident/incident log maintained", "mandatory": true},
      {"id": "item-13", "category": "Maintenance", "item": "Engine room bilge system functional", "mandatory": true},
      {"id": "item-14", "category": "Maintenance", "item": "Fire fighting systems tested", "mandatory": true}
    ]
  },
  {
    "id": "tpl-003",
    "name": "MLC Crew Welfare",
    "source_file_name": "MLC_Guidelines_2024.pdf",
    "source_type": "PDF",
    "created_at": "2024-06-13T09:45:00Z",
    "items": [
      {"id": "item-15", "category": "Employment", "item": "Sea Employment Agreement signed", "mandatory": true},
      {"id": "item-16", "category": "Employment", "item": "Wages paid on time", "mandatory": true},
      {"id": "item-17", "category": "Accommodation", "item": "Crew accommodation meets standards", "mandatory": true},
      {"id": "item-18", "category": "Welfare", "item": "Access to medical facilities", "mandatory": true},
      {"id": "item-19", "category": "Welfare", "item": "Communication rights verified", "mandatory": true},
      {"id": "item-20", "category": "Training", "item": "On-board safety training documented", "mandatory": true}
    ]
  }
];

export async function GET() {
  return NextResponse.json(SAMPLE_TEMPLATES);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const sourceFileName = String(body.source_file_name ?? "").trim();
  const sourceType = String(body.source_type ?? "TEXT").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "At least one checklist item is required" }, { status: 400 });
  }

  const template = await createComplianceTemplate({
    name,
    source_file_name: sourceFileName || "Manual entry",
    source_type: sourceType,
    items,
  });

  return NextResponse.json(template, { status: 201 });
}
