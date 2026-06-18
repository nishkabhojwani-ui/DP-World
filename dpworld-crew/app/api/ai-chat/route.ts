import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

interface FleetData {
  totalCrew: number;
  vessels: Array<{ id: string; name: string }>;
  expiringCerts: Array<{ crew_name: string; cert_type: string; expiry_date: string }>;
  activeChanges: number;
  crewChanges: Array<{ rank: string; status: string; planned_date: string }>;
}

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function getFleetData(): Promise<FleetData> {
  try {
    const supabase = getSupabaseClient();

    // Get crew count
    const { data: crewData } = await supabase.from("sea_contracts").select("*", { count: "exact" });

    // Get vessels
    const { data: vesselData } = await supabase.from("vessels").select("id, name");

    // Get crew changes
    const { data: changesData } = await supabase.from("crew_changes").select("rank, status, planned_date");

    const activeChanges = changesData?.filter((c) => c.status !== "completed").length || 0;

    return {
      totalCrew: crewData?.length || 0,
      vessels: vesselData || [],
      expiringCerts: [],
      activeChanges,
      crewChanges: changesData || [],
    };
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return {
      totalCrew: 0,
      vessels: [],
      expiringCerts: [],
      activeChanges: 0,
      crewChanges: [],
    };
  }
}

async function queryWithAI(userMessage: string, fleetData: FleetData): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemPrompt = `You are a helpful AI assistant for maritime fleet management. You have access to real-time fleet data and should help users with questions about their crew, vessels, and operations.

Current Fleet Data:
- Total crew on board: ${fleetData.totalCrew}
- Active vessels: ${fleetData.vessels.length}
- Active crew changes: ${fleetData.activeChanges}
- Vessels: ${fleetData.vessels.map((v) => v.name).join(", ")}

Recent crew changes by status:
${
  fleetData.crewChanges.slice(0, 5)
    .map((c) => `  - ${c.rank} | Status: ${c.status} | Planned: ${c.planned_date}`)
    .join("\n") || "  No crew changes"
}

Answer questions about the fleet concisely. If asked about specific data not available in your context, let the user know they should check the main dashboard for detailed information. Keep responses friendly and professional.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4.6",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "Unable to generate response";
  } catch (error) {
    console.error("AI query error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const fleetData = await getFleetData();
    const response = await queryWithAI(message, fleetData);

    return NextResponse.json({ response });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
