import { NextRequest, NextResponse } from "next/server";
import { runComplianceVerification } from "@/lib/compliance";

function streamJsonLine(controller: ReadableStreamDefaultController, payload: unknown) {
  controller.enqueue(`${JSON.stringify(payload)}\n`);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const crewId = String(body.crew_id ?? "").trim();
  const templateId = String(body.template_id ?? "").trim();

  if (!crewId || !templateId) {
    return NextResponse.json({ error: "crew_id and template_id are required" }, { status: 400 });
  }

  const run = await runComplianceVerification(templateId, crewId);

  const stream = new ReadableStream({
    async start(controller) {
      for (const result of run.results) {
        streamJsonLine(controller, { type: "result", result });
        await new Promise((resolve) => setTimeout(resolve, 140));
      }

      streamJsonLine(controller, {
        type: "done",
        run: {
          id: run.id,
          overall_status: run.overall_status,
          pass_count: run.pass_count,
          fail_count: run.fail_count,
          warn_count: run.warn_count,
          crew_name: run.crew_name,
          template_name: run.template_name,
          created_at: run.created_at,
        },
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
}
