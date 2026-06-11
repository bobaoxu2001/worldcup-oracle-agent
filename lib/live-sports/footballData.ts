/**
 * football-data.org client — alternative live tournament-state provider.
 *
 * Reads its token ONLY from the environment (never hard-coded / logged):
 *   FOOTBALL_DATA_API_KEY=<secret>   ← .env.local / Vercel env  (X-Auth-Token)
 *
 * v4 API: GET /v4/competitions/WC/matches covers World Cup fixtures/results,
 * which is everything the deterministic elimination gating needs. The free tier
 * has NO injuries endpoint, so this provider returns no injury data — injuries
 * remain news-context only. Fail-soft: any error returns null so the caller
 * falls back to the MongoDB cache, then demo mode.
 */

import { toSlug } from "./apiFootball";
import type { LiveFixture } from "./types";

const BASE = "https://api.football-data.org/v4";
// World Cup competition code in football-data.org is "WC".
const COMPETITION = process.env.FOOTBALL_DATA_COMPETITION || "WC";

export function footballDataConfigured(): boolean {
  return Boolean(
    process.env.FOOTBALL_DATA_API_KEY && process.env.FOOTBALL_DATA_API_KEY.length > 10
  );
}

// football-data.org stage → human round name. The classifier's knockout regex
// (/round of|knockout|quarter|semi|final/) must match the knockout names.
const STAGE_TO_ROUND: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  THIRD_PLACE: "Third place play-off",
  FINAL: "Final",
};

export interface FdMatch {
  id?: number;
  utcDate?: string;
  status?: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | AWARDED | ...
  stage?: string;
  homeTeam?: { name?: string; tla?: string | null };
  awayTeam?: { name?: string; tla?: string | null };
  score?: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime?: { home?: number | null; away?: number | null };
  };
}

/** Pure mapper: football-data.org match → normalized LiveFixture (unit-tested). */
export function mapFdMatch(m: FdMatch): LiveFixture {
  const finished = m.status === "FINISHED" || m.status === "AWARDED";
  const winner = m.score?.winner ?? null;
  return {
    id: m.id ?? 0,
    round: STAGE_TO_ROUND[m.stage ?? ""] ?? m.stage ?? "",
    // Normalize to the API-Football short codes the classifier understands.
    status: finished ? "FT" : m.status ?? "",
    homeSlug: toSlug(m.homeTeam?.name, m.homeTeam?.tla),
    awaySlug: toSlug(m.awayTeam?.name, m.awayTeam?.tla),
    goalsHome: m.score?.fullTime?.home ?? null,
    goalsAway: m.score?.fullTime?.away ?? null,
    homeWinner: winner === null || winner === "DRAW" ? null : winner === "HOME_TEAM",
    awayWinner: winner === null || winner === "DRAW" ? null : winner === "AWAY_TEAM",
    date: m.utcDate ?? "",
  };
}

export async function fetchFixturesFD(timeoutMs = 8000): Promise<LiveFixture[] | null> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/competitions/${COMPETITION}/matches`, {
      headers: { "X-Auth-Token": key },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[football-data] request failed: HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { matches?: FdMatch[] };
    if (!data?.matches) return null;
    return data.matches.map(mapFdMatch);
  } catch (err) {
    console.warn("[football-data] request error:", (err as Error)?.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
