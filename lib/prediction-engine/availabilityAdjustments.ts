/**
 * Squad-availability Elo adjustments — the "confirmed injuries / withdrawals"
 * layer that feeds the `squadStabilityAdjustment` slot in EloBreakdown.
 *
 * WHY THIS EXISTS, separate from ratings.ts and ratingUpdates.ts:
 *   • ratings.ts          — base May-2026 calibration (frozen).
 *   • ratingUpdates.ts    — deltas the model LEARNS from completed RESULTS.
 *   • this module         — a manual, sourced, CAPPED adjustment for squad news
 *                           that the results haven't priced in yet (a key player
 *                           ruled out, a captain withdrawing, etc.).
 *
 * Design rules (kept deliberately conservative so news can never dominate the
 * calibrated model):
 *   • Each entry is a single, real, SOURCED availability change with a signed
 *     Elo delta (negative = the team is weaker without the player).
 *   • A team's entries are summed, then CLAMPED to ±SQUAD_STABILITY_CAP.
 *   • Long-standing absences that are already reflected in the May calibration
 *     (e.g. a player out since last winter) get a small delta on purpose — we
 *     do not want to double-penalise something the base rating already saw.
 *
 * The effective rating the engine simulates with is:
 *     getEffectiveRating = getUpdatedRating (base + results) + availability
 *
 * Editing: add/remove entries below and redeploy. Keep `source` populated — the
 * UI labels this as a manually-curated, sourced signal, never a live feed.
 *
 * Last updated: 2026-06-14.
 */

import { getUpdatedRating } from "./ratingUpdates";
import { getConfederationDelta } from "./confederationForm";

/** Max absolute Elo a team's accumulated availability signal may move it. */
export const SQUAD_STABILITY_CAP = 40;

export interface AvailabilityAdjustment {
  /** Canonical team slug (see world-cup-2026-groups.ts). */
  team: string;
  /** Real player affected. */
  player: string;
  /** Signed Elo delta (negative = weaker). Summed then clamped per team. */
  delta: number;
  /** Short human-readable reason (rendered in the model factor). */
  reason: string;
  /** Where the news came from. */
  source: string;
  /** YYYY-MM-DD the change was confirmed. */
  date: string;
}

/**
 * Confirmed availability changes, newest first within a team.
 * Magnitudes are a transparent estimate, not a precise medical/tactical model.
 */
export const AVAILABILITY_ADJUSTMENTS: AvailabilityAdjustment[] = [
  // ── Japan ──────────────────────────────────────────────────────────────
  {
    team: "japan",
    player: "Kaoru Mitoma",
    delta: -15,
    reason: "Best attacker — left out of the 26-man squad with a hamstring injury",
    source: "Al Jazeera",
    date: "2026-05-15",
  },
  {
    team: "japan",
    player: "Wataru Endo",
    delta: -12,
    reason:
      "Captain & midfield anchor withdrew (foot injury) and retired from the national team; replaced by Shuto Machino",
    source: "ESPN",
    date: "2026-06-12",
  },
  {
    team: "japan",
    player: "Takumi Minamino",
    delta: -3,
    reason:
      "Torn ACL (Dec 2025) — long-term absence, already largely reflected in the May calibration",
    source: "ESPN",
    date: "2025-12-28",
  },

  // ── Germany ────────────────────────────────────────────────────────────
  {
    team: "germany",
    player: "Kai Havertz",
    delta: -6,
    reason:
      "Expected to miss the opening fixtures per Völler — short-term, group-stage only",
    source: "FotMob",
    date: "2026-06-12",
  },
  {
    team: "germany",
    player: "Lennart Karl",
    delta: -2,
    reason:
      "Torn muscle in training, out of the tournament; replaced by Assan Ouédraogo (fringe squad impact)",
    source: "ESPN",
    date: "2026-06-06",
  },
];

/** All availability entries on file for a team (newest dates first). */
export function getAvailabilityAdjustments(slug: string): AvailabilityAdjustment[] {
  return AVAILABILITY_ADJUSTMENTS.filter((a) => a.team === slug).sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );
}

/** Net availability Elo delta for a team, summed then clamped to ±cap. */
export function getAvailabilityDelta(slug: string): number {
  const raw = AVAILABILITY_ADJUSTMENTS.filter((a) => a.team === slug).reduce(
    (sum, a) => sum + a.delta,
    0
  );
  return Math.max(-SQUAD_STABILITY_CAP, Math.min(SQUAD_STABILITY_CAP, raw));
}

/**
 * The rating the engine actually simulates with — all capped layers folded in:
 *   base May-2026 calibration
 *   + completed-result deltas      (ratingUpdates.ts)
 *   + squad availability           (this file)
 *   + confederation tournament form (confederationForm.ts)
 */
export function getEffectiveRating(slug: string): number {
  return getUpdatedRating(slug) + getAvailabilityDelta(slug) + getConfederationDelta(slug);
}

/** Metadata for transparent UI labelling. */
export function availabilityMeta(): {
  teams: string[];
  entries: number;
  lastUpdated: string | null;
} {
  const teams = Array.from(new Set(AVAILABILITY_ADJUSTMENTS.map((a) => a.team)));
  const lastUpdated = AVAILABILITY_ADJUSTMENTS.reduce<string | null>(
    (latest, a) => (!latest || a.date > latest ? a.date : latest),
    null
  );
  return { teams, entries: AVAILABILITY_ADJUSTMENTS.length, lastUpdated };
}
