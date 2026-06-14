/**
 * Post-match Elo updates — the "agent learns from real outcomes" layer.
 *
 * The CALIBRATED ratings in ratings.ts are frozen at May 2026. This module
 * folds COMPLETED tournament results back into those ratings with the standard
 * Elo update (the previously unused K_FACTOR_WC = 60 from elo.ts):
 *
 *   expected = 1 / (1 + 10^((opponent − team) / 400))   (host bonus included,
 *                                                        same as the engine)
 *   actual   = 1 win · 0.5 draw · 0 loss
 *   delta    = K × (actual − expected)                  (zero-sum per match)
 *
 * Results are applied in date order, each on top of the deltas accumulated so
 * far. No goal-difference multiplier — the rest of the model doesn't use one.
 *
 * Source of truth is the manual results seed (the same editable layer the
 * schedule standings use). Verified cached fixtures are NOT read here because
 * this module must stay synchronous for the closed-form engine; if a cached
 * live result ever duplicates a manual pairing, remove the manual entry.
 *
 * Base ratings are never mutated — getUpdatedRating() = base + accumulated
 * delta, and the per-team deltas are exposed for transparent UI labelling.
 */

import { K_FACTOR_WC, expectedScore } from "./elo";
import { getRating, HOME_ADVANTAGE } from "./ratings";
import { HOST_SLUGS } from "@/lib/seed/world-cup-2026-groups";
import { MANUAL_MATCH_RESULTS } from "@/lib/seed/manual-match-results";

export interface CompletedResult {
  teamA: string; // slug
  teamB: string; // slug
  scoreA: number;
  scoreB: number;
  date?: string; // YYYY-MM-DD
}

export interface RatingUpdates {
  /** Accumulated raw Elo delta per team slug (unrounded). */
  deltas: Record<string, number>;
  resultsUsed: number;
  lastResultDate: string | null;
}

/** Same host home-field bonus the prediction engine applies to fixtures. */
function homeBonus(teamA: string, teamB: string): number {
  if (HOST_SLUGS.has(teamA) && !HOST_SLUGS.has(teamB)) return HOME_ADVANTAGE;
  if (HOST_SLUGS.has(teamB) && !HOST_SLUGS.has(teamA)) return -HOME_ADVANTAGE;
  return 0;
}

/** Pure Elo-update fold over completed results (date order, zero-sum). */
export function computeRatingUpdates(results: CompletedResult[]): RatingUpdates {
  const deltas: Record<string, number> = {};
  const d = (slug: string) => deltas[slug] ?? 0;
  const ordered = [...results].sort((x, y) => (x.date ?? "").localeCompare(y.date ?? ""));

  let lastResultDate: string | null = null;
  for (const r of ordered) {
    const ratingA = getRating(r.teamA) + d(r.teamA);
    const ratingB = getRating(r.teamB) + d(r.teamB);
    const expectedA = expectedScore(ratingA, ratingB, homeBonus(r.teamA, r.teamB));
    const actualA = r.scoreA > r.scoreB ? 1 : r.scoreA < r.scoreB ? 0 : 0.5;
    const delta = K_FACTOR_WC * (actualA - expectedA);
    deltas[r.teamA] = d(r.teamA) + delta;
    deltas[r.teamB] = d(r.teamB) - delta;
    if (r.date && (!lastResultDate || r.date > lastResultDate)) lastResultDate = r.date;
  }

  return { deltas, resultsUsed: ordered.length, lastResultDate };
}

let _applied: RatingUpdates | null = null;
function applied(): RatingUpdates {
  if (!_applied) _applied = computeRatingUpdates(MANUAL_MATCH_RESULTS);
  return _applied;
}

/** Base May-2026 rating + accumulated result deltas, rounded for display/model. */
export function getUpdatedRating(slug: string): number {
  return Math.round(getRating(slug) + (applied().deltas[slug] ?? 0));
}

/** Rounded per-team delta from completed results (0 when untouched). */
export function getResultDelta(slug: string): number {
  return getUpdatedRating(slug) - getRating(slug);
}

/** Metadata for transparent UI labelling. */
export function ratingUpdatesMeta(): {
  resultsUsed: number;
  lastResultDate: string | null;
  deltas: Record<string, number>;
} {
  const { deltas, resultsUsed, lastResultDate } = applied();
  const rounded: Record<string, number> = {};
  for (const slug of Object.keys(deltas)) rounded[slug] = Math.round(deltas[slug]);
  return { resultsUsed, lastResultDate, deltas: rounded };
}
