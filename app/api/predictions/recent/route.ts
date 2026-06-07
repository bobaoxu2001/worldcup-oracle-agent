import { NextResponse } from "next/server";
import { getRecentPredictions } from "@/lib/db/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/predictions/recent?limit=8
 * Returns recent prediction interactions from the agent's memory.
 * Always succeeds — falls back to the in-memory store when MongoDB is absent.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 8, 1), 20);
    const { items, source } = await getRecentPredictions(limit);
    return NextResponse.json({ source, count: items.length, items });
  } catch (err) {
    console.error("[/api/predictions/recent] error:", err);
    // Never break the UI — return an empty list.
    return NextResponse.json({ source: "memory", count: 0, items: [] });
  }
}
