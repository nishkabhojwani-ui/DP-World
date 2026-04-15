import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import { getTableConfig } from "@/lib/table-config";

const DATA_DIR = path.join(process.cwd(), "data");

export function dataPath(filename: string) {
  return path.join(DATA_DIR, filename);
}

function normalizeCellValue(val: unknown) {
  if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  return val ?? null;
}

function readSheetFromWorkbook<T>(filePath: string): Promise<T[]> {
  return (async () => {
    if (!fs.existsSync(filePath)) return [];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const rows: T[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => {
          headers.push(String(cell.value ?? ""));
        });
      } else {
        const obj: Record<string, unknown> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            obj[header] = normalizeCellValue(cell.value);
          }
        });
        if (Object.keys(obj).length > 0) rows.push(obj as T);
      }
    });

    return rows;
  })();
}

function serializeRowForSupabase(
  filename: string,
  row: Record<string, unknown>
): Record<string, unknown> {
  const config = getTableConfig(filename);
  if (!config?.jsonColumns?.length) return row;

  const next = { ...row };
  for (const column of config.jsonColumns) {
    const value = next[column];
    if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
      try {
        next[column] = JSON.parse(value);
      } catch {
        next[column] = value;
      }
    }
  }
  return next;
}

export async function readSheet<T>(filename: string): Promise<T[]> {
  const config = getTableConfig(filename);
  if (isSupabaseConfigured() && config) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(config.tableName).select("*");
    if (error) throw error;
    return (data ?? []) as T[];
  }

  const filePath = dataPath(filename);
  return readSheetFromWorkbook<T>(filePath);
}

export async function writeSheet<T extends Record<string, unknown>>(
  filename: string,
  data: T[]
): Promise<void> {
  if (data.length === 0) return;
  const config = getTableConfig(filename);

  if (isSupabaseConfigured() && config) {
    const supabase = getSupabaseAdminClient();
    const prepared = data.map((row) => serializeRowForSupabase(filename, row));
    const { error } = await supabase.from(config.tableName).upsert(prepared as never, { onConflict: "id" });
    if (error) throw error;
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  const headers = Object.keys(data[0]);

  worksheet.addRow(headers);

  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val !== null && typeof val === "object") return JSON.stringify(val);
      return val;
    });
    worksheet.addRow(values);
  }

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0A1F44" },
  };
  headerRow.height = 20;

  await workbook.xlsx.writeFile(dataPath(filename));
}

export async function updateRow<T extends Record<string, unknown>>(
  filename: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const config = getTableConfig(filename);
  if (isSupabaseConfigured() && config) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from(config.tableName)
      .update(serializeRowForSupabase(filename, updates as Record<string, unknown>) as never)
      .eq("id", id);
    if (error) throw error;
    return;
  }

  const rows = await readSheet<T>(filename);
  const idx = rows.findIndex((r: Record<string, unknown>) => r.id === id);
  if (idx === -1) throw new Error(`Row with id ${id} not found`);
  rows[idx] = { ...rows[idx], ...updates };
  await writeSheet(filename, rows);
}

export async function insertRow<T extends Record<string, unknown>>(
  filename: string,
  row: T
): Promise<void> {
  const config = getTableConfig(filename);
  if (isSupabaseConfigured() && config) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from(config.tableName)
      .insert(serializeRowForSupabase(filename, row) as never);
    if (error) throw error;
    return;
  }

  const rows = await readSheet<T>(filename);
  rows.push(row);
  await writeSheet(filename, rows);
}
