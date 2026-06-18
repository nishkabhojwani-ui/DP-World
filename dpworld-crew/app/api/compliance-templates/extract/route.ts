import { NextResponse } from "next/server";
import { extractChecklistItems, getSourceType } from "@/lib/compliance";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

function streamJsonLine(controller: ReadableStreamDefaultController, payload: unknown) {
  controller.enqueue(`${JSON.stringify(payload)}\n`);
}

async function fileToText(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const data = await pdfParse(bytes);
      const text = data.text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line)
        .join('\n')
        .replace(/\s+/g, ' ')
        .trim();
      return text;
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
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
