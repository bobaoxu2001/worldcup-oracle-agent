/**
 * Deterministic World Cup 2026 schedule built from EXISTING data only:
 *   • group fixtures — the 6 round-robin pairings per group, from the real draw
 *     (lib/seed/world-cup-2026-groups.ts). Pairings are real; official dates /
 *     venues are NOT in the seed, so they are shown as "TBA" (never invented).
 *   • knockout fixtures — the official 2026 bracket (lib/prediction-engine/
 *     bracket-2026.ts): match number, round, and positional slots (1A, 2B, …).
 *     Teams resolve only after the groups finish, so they show as slots + "TBA".
 *
 * Live fixtures (real dates/results) come separately from the football-data.org
 * cache via getCachedFixtures() — this module never invents official details.
 */

import { GROUPS, getTeam } from "@/lib/seed/world-cup-2026-groups";
import { BRACKET_2026, positionLabel, type Round } from "@/lib/prediction-engine/bracket-2026";
import { MANUAL_MATCH_RESULTS } from "@/lib/seed/manual-match-results";
import type { LiveFixture } from "@/lib/live-sports/types";

export interface ScheduleRow {
  stage: string;
  group?: string;
  matchNo?: number;
  teamA: string;
  teamB: string;
  /** Canonical slugs (group fixtures only) — used to match cached live fixtures. */
  slugA?: string;
  slugB?: string;
  date: string; // ISO date or "TBA"
  venue: string; // city/venue or "TBA"
  status: "Scheduled" | "Finished" | "Live" | "TBA" | "Unknown";
  /** Final score when a matched live fixture is finished, e.g. "1–2". */
  score?: string;
  /** Structured goals (slugA's / slugB's) when a result is known — feeds standings. */
  goalsA?: number;
  goalsB?: number;
  /** Where the result came from: verified live cache vs manual seed entry. */
  resultSource?: "live" | "manual";
}

export interface GroupFixtures {
  group: string;
  rows: ScheduleRow[];
}

// Standard 4-team round-robin order (each team plays the other three).
const RR_PAIRS: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

export function buildGroupFixtures(): GroupFixtures[] {
  return GROUPS.map((g) => ({
    group: g.name,
    rows: RR_PAIRS.map(([i, j]) => {
      const a = getTeam(g.teams[i]);
      const b = getTeam(g.teams[j]);
      return {
        stage: `Group ${g.name}`,
        group: g.name,
        teamA: `${a.flag} ${a.name}`,
        teamB: `${b.flag} ${b.name}`,
        slugA: a.slug,
        slugB: b.slug,
        date: "TBA",
        venue: "TBA",
        status: "Scheduled" as const,
      };
    }),
  }));
}

const ROUND_LABEL: Record<Round, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  Final: "Final",
};

export function buildKnockoutFixtures(): ScheduleRow[] {
  return BRACKET_2026.map((m) => ({
    stage: ROUND_LABEL[m.round] ?? m.round,
    matchNo: m.no,
    teamA: positionLabel(m.home),
    teamB: positionLabel(m.away),
    date: "TBA",
    venue: "TBA",
    status: "TBA" as const,
  }));
}

const FINISHED = new Set(["FINISHED", "AWARDED", "FT", "AET", "PEN"]);
const LIVE = new Set(["IN_PLAY", "PAUSED", "LIVE", "1H", "2H", "HT", "ET"]);
const SCHEDULED = new Set(["SCHEDULED", "TIMED", "NS"]);

function liveStatus(s: string): ScheduleRow["status"] {
  if (FINISHED.has(s)) return "Finished";
  if (LIVE.has(s)) return "Live";
  if (SCHEDULED.has(s)) return "Scheduled";
  return "Unknown";
}

function teamLabel(slug: string | null): string {
  if (!slug) return "TBA";
  try {
    const t = getTeam(slug);
    return `${t.flag} ${t.name}`;
  } catch {
    return "TBA";
  }
}

/**
 * Merge cached live fixtures (football-data.org) into the drawn group pairings:
 * when a cached fixture has the SAME two teams (either order), its verified
 * kickoff date / status / score replace the "TBA" placeholders. Pairings
 * without a cached fixture stay TBA — dates are never invented.
 */
export function mergeLiveIntoGroups(
  groups: GroupFixtures[],
  fixtures: LiveFixture[]
): GroupFixtures[] {
  if (!fixtures.length) return groups;
  const byPair = new Map<string, LiveFixture>();
  for (const f of fixtures) {
    if (!f.homeSlug || !f.awaySlug) continue;
    byPair.set([f.homeSlug, f.awaySlug].sort().join("|"), f);
  }
  return groups.map((g) => ({
    group: g.group,
    rows: g.rows.map((r) => {
      if (!r.slugA || !r.slugB) return r;
      const f = byPair.get([r.slugA, r.slugB].sort().join("|"));
      if (!f) return r;
      const status = liveStatus(f.status);
      const hasGoals = typeof f.goalsHome === "number" && typeof f.goalsAway === "number";
      // Orient goals to the row's slugA/slugB (the cached fixture may be flipped).
      const flipped = f.homeSlug === r.slugB;
      const goalsA = hasGoals ? (flipped ? f.goalsAway! : f.goalsHome!) : undefined;
      const goalsB = hasGoals ? (flipped ? f.goalsHome! : f.goalsAway!) : undefined;
      const score = hasGoals ? `${goalsA}–${goalsB}` : undefined;
      return {
        ...r,
        date: f.date || "TBA",
        status,
        score,
        goalsA,
        goalsB,
        resultSource: hasGoals ? ("live" as const) : undefined,
      };
    }),
  }));
}

/**
 * Merge MANUALLY ENTERED results (lib/seed/manual-match-results.ts) into the
 * group pairings. Transparency rules:
 *   • a pairing that already has a verified live result keeps it — a manual
 *     entry NEVER overrides the football-data.org cache;
 *   • manual results are tagged resultSource "manual" so every consumer
 *     (schedule rows, standings) can label them honestly.
 */
export function mergeManualIntoGroups(groups: GroupFixtures[]): GroupFixtures[] {
  if (!MANUAL_MATCH_RESULTS.length) return groups;
  const byPair = new Map(
    MANUAL_MATCH_RESULTS.map((m) => [[m.teamA, m.teamB].sort().join("|"), m])
  );
  return groups.map((g) => ({
    group: g.group,
    rows: g.rows.map((r) => {
      if (!r.slugA || !r.slugB) return r;
      if (r.resultSource === "live") return r; // verified live result wins
      const m = byPair.get([r.slugA, r.slugB].sort().join("|"));
      if (!m) return r;
      const flipped = m.teamA === r.slugB;
      const goalsA = flipped ? m.scoreB : m.scoreA;
      const goalsB = flipped ? m.scoreA : m.scoreB;
      return {
        ...r,
        // Keep a verified kickoff date from the live cache if we have one;
        // the manual date only fills a TBA.
        date: r.date !== "TBA" ? r.date : m.date || r.date,
        status: "Finished" as const,
        score: `${goalsA}–${goalsB}`,
        goalsA,
        goalsB,
        resultSource: "manual" as const,
      };
    }),
  }));
}

/** The knockout bracket grouped into round columns (R32 → Final) for the UI. */
export function bracketColumns(): { round: string; matches: ScheduleRow[] }[] {
  const rows = buildKnockoutFixtures();
  const order = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"];
  return order.map((round) => ({
    round,
    matches: rows.filter((r) => r.stage === round),
  }));
}

export interface LiveScheduleRow extends ScheduleRow {
  goals: string;
}

/** Map cached football-data.org fixtures → display rows (real dates/results). */
export function mapLiveFixtures(fixtures: LiveFixture[]): LiveScheduleRow[] {
  const rows: LiveScheduleRow[] = fixtures.map((f) => ({
    stage: f.round || "Fixture",
    teamA: teamLabel(f.homeSlug),
    teamB: teamLabel(f.awaySlug),
    slugA: f.homeSlug ?? undefined,
    slugB: f.awaySlug ?? undefined,
    date: f.date || "TBA",
    venue: "TBA", // football-data.org match list does not include venue here
    status: liveStatus(f.status),
    goals:
      typeof f.goalsHome === "number" && typeof f.goalsAway === "number"
        ? `${f.goalsHome}–${f.goalsAway}`
        : "",
  }));
  return rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
