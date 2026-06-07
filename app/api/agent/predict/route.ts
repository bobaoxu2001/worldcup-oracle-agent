import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agent/predict
 * Body: { query: string, isFollowUp?: boolean, contextTeams?: string[] }
 * Runs the full agent pipeline and returns an AgentResponse.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      isFollowUp?: boolean;
      contextTeams?: string[];
    };
    const query = (body.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "Missing 'query'." }, { status: 400 });
    }
    if (query.length > 300) {
      return NextResponse.json({ error: "Query too long." }, { status: 400 });
    }

    const response = await runAgent({
      query,
      isFollowUp: Boolean(body.isFollowUp),
      contextTeams: Array.isArray(body.contextTeams) ? body.contextTeams.slice(0, 2) : undefined,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/agent/predict] error:", err);
    return NextResponse.json(
      { error: "The agent hit an unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
