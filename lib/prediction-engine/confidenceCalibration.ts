/**
 * Global confidence calibration — a capped expansion of the fixture Elo gap.
 *
 * WHY THIS LAYER EXISTS (fitted 2 July 2026, 82 completed matches):
 * the walk-forward backtest's reliability table showed the stacked model had
 * become systematically UNDER-confident on favourites once the knockout
 * results landed — outcomes predicted at 60–80% were happening 81% of the
 * time (n=26, gap +12pp) and the 80–100% bucket ran 90% observed vs 84%
 * predicted, while longshots (0–20% bucket) were over-priced (11% predicted,
 * 7% observed). `npm run evolve` grid-searches a global gap scale jointly
 * with the draw boost over both sides of 1.0; the 82-match optimum sat at
 * the 1.24 grid edge (LogLoss 0.791 → 0.774). Per the house discipline the
 * fitted value is SHRUNK well short of the grid edge (small sample, and the
 * early-tournament fit said 1.0), and the per-side Elo shift is hard-capped
 * so a blowout matchup can never be inflated without bound.
 *
 * WHAT IT DOES: for a fixture with effective ratings (eloA, eloB), each side
 * moves (GAP_SCALE − 1)/2 × (eloA − eloB) AWAY from the midpoint — the
 * favourite up, the underdog down — clipped to ±GAP_CAL_CAP Elo per side.
 * Equal ratings are untouched; ordering is always preserved; the transform
 * is zero-sum and symmetric in the team order.
 *
 * WHERE IT APPLIES: every place a fixture probability is formed — predictMatch,
 * the Monte-Carlo simulator's matchupRatings, and the agent's neutral-ground
 * head-to-head — and it is mirrored in scripts/backtest.ts as its own variant
 * so the marginal value stays visible. It is a CALIBRATION transform, not a
 * team-strength opinion: it lives outside getEffectiveRating and does not
 * touch the frozen base ratings or any Elo layer.
 *
 * RE-FIT PROTOCOL: re-run `npm run evolve` as rounds land. If the optimum
 * returns toward 1.0, shrink or retire this layer; if it keeps climbing,
 * raise GAP_SCALE cautiously (never past the grid optimum, never uncapped).
 */

/** Global gap-expansion factor (1.0 = off). Grid optimum 1.24 → shrunk to 1.10. */
export const GAP_SCALE = 1.1;

/** Hard cap on the calibration shift per side, in Elo points. */
export const GAP_CAL_CAP = 30;

export interface GapCalibration {
  /** Elo shift applied to side A (positive when A is the favourite). */
  a: number;
  /** Elo shift applied to side B (always −a). */
  b: number;
  /** True when the shift is big enough to matter (≥ 1 Elo per side). */
  active: boolean;
}

/** The capped, zero-sum calibration shift for a fixture's rating pair. */
export function gapCalibration(eloA: number, eloB: number): GapCalibration {
  const half = ((GAP_SCALE - 1) * (eloA - eloB)) / 2;
  const adj = Math.max(-GAP_CAL_CAP, Math.min(GAP_CAL_CAP, half));
  return { a: adj, b: -adj, active: Math.abs(adj) >= 1 };
}
