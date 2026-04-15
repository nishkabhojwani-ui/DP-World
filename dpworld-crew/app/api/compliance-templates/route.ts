import { NextRequest, NextResponse } from "next/server";
import { createComplianceTemplate, listComplianceTemplates } from "@/lib/compliance";

export async function GET() {
  const templates = await listComplianceTemplates();
  return NextResponse.json(templates);
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
