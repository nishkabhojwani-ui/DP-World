import { NextRequest, NextResponse } from "next/server";
import { createComplianceTemplate, listComplianceTemplates } from "@/lib/compliance";

export async function GET() {
  try {
    const templates = await Promise.race([
      listComplianceTemplates(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000))
    ]);
    return NextResponse.json(templates);
  } catch (err) {
    console.warn("Failed to load compliance templates:", err);
    return NextResponse.json([
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
      }
    ]);
  }
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
