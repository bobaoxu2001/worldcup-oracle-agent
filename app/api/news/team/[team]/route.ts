import { NextResponse } from "next/server";
import { getNewsForTeam } from "@/lib/news/newsIngestor";
import { teamRef } from "@/lib/agent/matchResolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/news/team/[team]?limit=8
 * Returns recent news for a specific team, newest first (limit 1–10).
 * Always succeeds — seeds curated demo signals if the store is empty.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ team: string }> }
) {
  try {
    const { team } = await params;
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 8, 1), 10);

    const { items, source } = await getNewsForTeam(team, limit);
    let teamMeta: { slug: string; name: string; flag: string } | null = null;
    try {
      const t = teamRef(team);
      teamMeta = { slug: t.slug, name: t.name, flag: t.flag };
    } catch {
      teamMeta = null;
    }

    return NextResponse.json({ team: teamMeta ?? { slug: team }, source, count: items.length, items });
  } catch (err) {
    console.error("[/api/news/team] error:", err);
    return NextResponse.json({ team: null, source: "demo", count: 0, items: [] });
  }
}
