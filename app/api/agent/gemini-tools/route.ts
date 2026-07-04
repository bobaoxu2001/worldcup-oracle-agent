import { NextResponse } from "next/server";
import { runGeminiAgent, geminiAgentEnabled } from "@/lib/llm/geminiAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agent/gemini-tools   { "query": "Will the USA beat Argentina?" }
 *
 * Runs the Gemini function-calling agent loop: Gemini chooses which
 * deterministic tools to call (resolve_team, predict_match, get_team_news,
 * get_tournament_state), and we execute them and feed the results back until it
 * settles on an answer. The response includes the tool-call trace so the agentic
 * loop is inspectable.
 *
 * Fail-soft: returns HTTP 200 with `available:false` when no Gemini key is
 * configured (the rest of the app runs on the deterministic pipeline), so this
 * endpoint never errors the demo.
 */
export async function POST(req: Request) {
  if (!geminiAgentEnabled()) {
    return NextResponse.json({
      available: false,
      reason: "No Gemini API key configured — the app runs on the deterministic pipeline.",
    });
  }

  let query = "";
  try {
    const body = (await req.json()) as { query?: unknown };
    query = String(body?.query ?? "").trim().slice(0, 300);
  } catch {
    /* empty/invalid body handled below */
  }
  if (!query) {
    return NextResponse.json({ available: true, error: "Provide a non-empty `query`." }, { status: 400 });
  }

  const result = await runGeminiAgent(query);
  if (!result) {
    return NextResponse.json({
      available: true,
      settled: false,
      note: "Gemini did not settle on an answer; the app would fall back to the deterministic pipeline.",
    });
  }

  return NextResponse.json(
    {
      available: true,
      settled: true,
      query,
      answer: result.text,
      rounds: result.rounds,
      toolCalls: result.toolCalls,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
