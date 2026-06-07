import { NextResponse } from "next/server";
import { refreshNews, TRACKED_TEAMS } from "@/lib/news/newsIngestor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily news refresh endpoint.
 *
 *   GET  /api/news/refresh            → refresh all tracked teams
 *   GET  /api/news/refresh?team=brazil → refresh one team
 *   POST /api/news/refresh            → same as GET (for schedulers that POST)
 *
 * Fetches recent news for tracked teams, classifies + scores each item, and
 * saves to MongoDB `team_news` (falling back to the in-memory store). With no
 * news API key configured it refreshes with curated demo signals, so it always
 * returns a useful summary and never breaks.
 *
 * ── Schedule it daily ─────────────────────────────────────────────────────
 * Vercel Cron (vercel.json):
 *   { "crons": [{ "path": "/api/news/refresh", "schedule": "0 6 * * *" }] }
 * GitHub Actions / any external scheduler:
 *   curl -fsS https://<your-app>/api/news/refresh
 */
async function handle(req: Request) {
  try {
    const url = new URL(req.url);
    const team = url.searchParams.get("team");
    const teams = team ? [team] : TRACKED_TEAMS;
    const summary = await refreshNews(teams);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[/api/news/refresh] error:", err);
    // Never hard-fail a scheduler — report the problem with a 200-ish shape.
    return NextResponse.json(
      { ok: false, error: "Refresh failed but the app continues to run on existing data." },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
