/**
 * Group-stage draw-propensity correction — the "openers draw more than raw Elo
 * says" layer.
 *
 * WHY THIS EXISTS (and why it is NOT an Elo layer):
 *   The 11–15 June group openers drew at 50% (8/16); an Elo + Dixon-Coles model
 *   calibrated on general internationals expects ~23%. Even allowing for a small
 *   sample, World Cup GROUP matches — especially matchday-1 openers — are
 *   structurally cagier (rust, fitness, "don't lose first") and draw more than
 *   the league-style baseline. A walk-forward backtest showed the model's whole
 *   error budget was draws, not picking the wrong team.
 *
 *   Crucially, the fix is NOT to narrow the Elo gap: that would symmetrically
 *   inflate the UNDERDOG'S WIN probability, and the data showed favourites
 *   rarely LOST — they were HELD. So this layer adds mass to the DRAW outcome
 *   specifically, shrinking both win probabilities proportionally and leaving
 *   the favourite unchanged.
 *
 * Design (small, capped, transparent):
 *   • Only applies to genuine GROUP fixtures (both teams in the same group).
 *     Knockout / cross-group hypotheticals are untouched (they go to ET/pens).
 *   • Strongest for true OPENERS (neither side has played yet); tapered once a
 *     team has results on the board — a data-driven proxy for matchday.
 *   • The draw is multiplied up to a hard ceiling, never enough to make a draw
 *     an absurd outright pick. Target ≈ historical WC group draw rate (~28–31%),
 *     NOT this round's freak 50%.
 *
 * Pure helpers (drawMultiplierFor / inflateDraw) take their inputs explicitly so
 * the backtest can recompute them walk-forward; applyDrawPropensity is the
 * engine-facing convenience that reads current played-status from the results.
 *
 * Last updated: 2026-06-17.
 */

import { groupOf } from "@/lib/seed/world-cup-2026-groups";
import { MANUAL_MATCH_RESULTS } from "@/lib/seed/manual-match-results";

/**
 * Max relative inflation of the draw probability (pure opener, group match).
 * FITTED, not guessed: a walk-forward grid search over every completed match
 * (`npm run evolve`) minimises log-loss as this rises. On the CURRENT sample —
 * 20 matchday-1 openers, which draw ~40% — the fit keeps climbing to the top of
 * the search grid, so chasing the exact optimum would over-fit an all-openers
 * round. We set 0.33: it captures nearly all of the log-loss gain, while the
 * 42% ceiling + opener taper hold the AVERAGE group draw prediction near the
 * long-run WC group rate (~30%). Re-run evolve once matchdays 2–3 land (fewer
 * draws expected as teams must chase points) and re-fit toward that.
 */
export const GROUP_DRAW_BOOST = 0.33;
/** Hard ceiling on the post-adjustment draw probability. */
export const DRAW_CEIL = 0.42;

/** Teams with at least one completed result on file (proxy for "has played"). */
const PLAYED_TEAMS = new Set<string>(
  MANUAL_MATCH_RESULTS.flatMap((m) => [m.teamA, m.teamB])
);

/** True when both teams are drawn into the same group (a real group fixture). */
export function isGroupFixture(aSlug: string, bSlug: string): boolean {
  try {
    return groupOf(aSlug).name === groupOf(bSlug).name;
  } catch {
    return false;
  }
}

/**
 * Draw multiplier from the matchup type and how many of the two sides have
 * already played. Non-group → 1 (no change). Group → tapered by opener-ness:
 * neither played (matchday-1 opener) gets the full boost; it shrinks as results
 * accumulate.
 */
export function drawMultiplierFor(isGroup: boolean, playedCount: number): number {
  if (!isGroup) return 1;
  const w = playedCount <= 0 ? 1.0 : playedCount === 1 ? 0.6 : 0.4;
  return 1 + GROUP_DRAW_BOOST * w;
}

export interface InflatedProb {
  winA: number;
  draw: number;
  winB: number;
  /** Absolute increase in draw probability applied (0 if none). */
  boost: number;
  applied: boolean;
}

/**
 * Move probability mass into the draw by `mult`, capped at DRAW_CEIL, shrinking
 * both win probabilities proportionally so the favourite (and the win-odds
 * ratio) is preserved and the three outcomes still sum to 1.
 */
export function inflateDraw(
  winA: number,
  draw: number,
  winB: number,
  mult: number
): InflatedProb {
  const newDraw = Math.min(draw * mult, DRAW_CEIL);
  if (mult <= 1 || newDraw <= draw || draw >= 1) {
    return { winA, draw, winB, boost: 0, applied: false };
  }
  const scale = (1 - newDraw) / (1 - draw);
  return {
    winA: winA * scale,
    draw: newDraw,
    winB: winB * scale,
    boost: newDraw - draw,
    applied: true,
  };
}

export interface DrawAdjusted {
  winA: number;
  draw: number;
  winB: number;
  boost: number;
  applied: boolean;
  mult: number;
}

/**
 * Engine-facing: apply the group-stage draw correction to a 1X2 distribution
 * using the CURRENT played-status of the two teams. Returns the (possibly
 * unchanged) distribution plus the boost applied, for transparent labelling.
 */
export function applyDrawPropensity(
  p: { winA: number; draw: number; winB: number },
  aSlug: string,
  bSlug: string
): DrawAdjusted {
  const isGroup = isGroupFixture(aSlug, bSlug);
  const playedCount = (PLAYED_TEAMS.has(aSlug) ? 1 : 0) + (PLAYED_TEAMS.has(bSlug) ? 1 : 0);
  const mult = drawMultiplierFor(isGroup, playedCount);
  const r = inflateDraw(p.winA, p.draw, p.winB, mult);
  return { winA: r.winA, draw: r.draw, winB: r.winB, boost: r.boost, applied: r.applied, mult };
}

/** Metadata for transparent UI labelling. */
export function drawPropensityMeta(): {
  boost: number;
  ceil: number;
  playedTeams: number;
} {
  return { boost: GROUP_DRAW_BOOST, ceil: DRAW_CEIL, playedTeams: PLAYED_TEAMS.size };
}
