import fs from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { extractChecklistItems, getSourceType } from "@/lib/compliance";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);

function streamJsonLine(controller: ReadableStreamDefaultController, payload: unknown) {
  controller.enqueue(`${JSON.stringify(payload)}\n`);
}

async function fileToText(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
    await fs.writeFile(tmpPath, bytes);
    try {
      const scriptPath = path.join(process.cwd(), "scripts", "extract-pdf-text.mjs");
      const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, tmpPath], {
        maxBuffer: 10 * 1024 * 1024,
      });

      // Check if PDF extraction is not supported
      if (stderr && stderr.includes("PDF_NOT_SUPPORTED")) {
        throw new Error("PDF extraction is not supported in this environment. Please upload a .txt or .md file instead, or copy the PDF text into a text file.");
      }

      const parsed = JSON.parse(stdout) as { text?: string };
      return parsed.text ?? "";
    } finally {
      await fs.unlink(tmpPath).catch(() => undefined);
    }
  }
  return bytes.toString("utf8");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Document upload is required" }, { status: 400 });
    }

    const text = await fileToText(file);
    const items = await extractChecklistItems(text, file.name);
    const sourceType = getSourceType(file.name);

    const stream = new ReadableStream({
      async start(controller) {
        streamJsonLine(controller, {
          type: "meta",
          text_length: text.length,
          item_count: items.length,
        });

        for (const item of items) {
          streamJsonLine(controller, { type: "item", item });
          await new Promise((resolve) => setTimeout(resolve, 120));
        }

        streamJsonLine(controller, {
          type: "done",
          source_file_name: file.name,
          source_type: sourceType,
          item_count: items.length,
        });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
