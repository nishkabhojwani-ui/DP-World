import dotenv from "dotenv";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();
const dataDir = path.join(cwd, "data");

dotenv.config({ path: path.join(cwd, ".env.local") });
dotenv.config({ path: path.join(cwd, ".env") });

const files = [
  ["vessels.xlsx", "vessels", ["required_manning"]],
  ["crew_members.xlsx", "crew_members", ["emergency_contact", "bank_details"]],
  ["certifications.xlsx", "certifications", ["ai_extracted_data"]],
  ["sea_contracts.xlsx", "sea_contracts", []],
  ["rest_hours_log.xlsx", "rest_hours_log", []],
  ["crew_changes.xlsx", "crew_changes", ["flight_details", "hotel_details"]],
  ["pre_joining_checklists.xlsx", "pre_joining_checklists", []],
  ["recruitment_requisitions.xlsx", "recruitment_requisitions", ["required_cert_types"]],
  ["candidates.xlsx", "candidates", ["ai_parsed_data"]],
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeCellValue(value) {
  if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return value ?? null;
}

async function readExcelRows(filename) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(dataDir, filename));
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = [];
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => headers.push(String(cell.value ?? "")));
      return;
    }

    const record = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) record[header] = normalizeCellValue(cell.value);
    });
    rows.push(record);
  });

  return rows;
}

async function readJsonArray(filename) {
  try {
    const raw = await fs.readFile(path.join(dataDir, filename), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

for (const [filename, tableName] of files) {
  const rows = await readExcelRows(filename);
  if (rows.length === 0) {
    console.log(`Skipping ${tableName}: no rows`);
    continue;
  }

  const { error } = await supabase.from(tableName).upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Imported ${rows.length} rows into ${tableName}`);
}

for (const [filename, tableName] of [
  ["compliance_templates.json", "compliance_templates"],
  ["compliance_runs.json", "compliance_runs"],
]) {
  const rows = await readJsonArray(filename);
  if (rows.length === 0) {
    console.log(`Skipping ${tableName}: no rows`);
    continue;
  }

  const { error } = await supabase.from(tableName).upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Imported ${rows.length} rows into ${tableName}`);
}

console.log("Supabase import complete.");
