/**
 * Tests for the global confidence-calibration layer (confidenceCalibration.ts).
 *
 * Run with:  npm run test:calibration
 *
 * Contract-based (no hard-coded teams/results, so knockout rounds landing
 * cannot stale these): the transform is zero-sum, symmetric in team order,
 * order-preserving, capped, and a no-op for level fixtures; and the engine's
 * predictMatch surfaces it as a labelled, explained ModelFactor exactly when
 * it moves the numbers.
 *
 * Exits with code 1 if any assertion fails.
 */

import assert from "node:assert";
import {
  gapCalibration,
  GAP_SCALE,
  GAP_CAL_CAP,
} from "@/lib/prediction-engine/confidenceCalibration";
import { predictMatch, getEffectiveRating } from "@/lib/prediction-engine";
import { GROUPS } from "@/lib/seed/world-cup-2026-groups";

let passed = 0;
function check(name: string, cond: boolean, detail = "") {
  assert.ok(cond, `FAILED: ${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`  ✓ ${name}`);
  passed++;
}

console.log("pure transform contract:");
check("level fixture is untouched", gapCalibration(1800, 1800).a === 0 && !gapCalibration(1800, 1800).active);
const c1 = gapCalibration(1900, 1800); // favourite A by 100
check("favourite moves up, underdog down by the same amount (zero-sum)", c1.a > 0 && c1.b === -c1.a);
check(`shift is (GAP_SCALE−1)/2 of the gap (${((GAP_SCALE - 1) * 50).toFixed(1)} for a 100 gap)`, Math.abs(c1.a - (GAP_SCALE - 1) * 50) < 1e-9);
const c2 = gapCalibration(1800, 1900);
check("symmetric in team order (flip teams → mirrored shifts)", c2.a === -c1.a && c2.b === c1.a);
const big = gapCalibration(2400, 1500); // 900 gap → uncapped would be 45/side
check(`hard cap binds at ±${GAP_CAL_CAP} per side`, big.a === GAP_CAL_CAP && big.b === -GAP_CAL_CAP);
check("calibrated ordering always preserved (favourite stays favourite)",
  [ [1900, 1800], [1810, 1800], [2400, 1500] ].every(([a, b]) => a + gapCalibration(a, b).a > b + gapCalibration(a, b).b));
check("tiny gaps stay inactive (no noise amplification)", !gapCalibration(1805, 1800).active);

console.log("engine integration (dynamic fixture discovery):");
// Find a big-gap and a near-level pairing from the live effective ratings, so
// this section never pins specific teams (ratings drift as results land).
const slugs = GROUPS.flatMap((g) => g.teams);
const byElo = [...slugs].sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a));
const strong = byElo[0];
const weak = byElo[byElo.length - 1];
const gapNow = getEffectiveRating(strong) - getEffectiveRating(weak);
check("test fixture has a real gap to calibrate", gapNow > 50, `${strong} vs ${weak} gap ${gapNow}`);

const pred = predictMatch(strong, weak);
const calFactor = pred.factors.find((f) => f.label.startsWith("Confidence calibration"));
check("big-gap prediction surfaces the calibration ModelFactor", !!calFactor);
check("factor explains the fit + the cap (honest provenance)",
  !!calFactor && /walk-forward/i.test(calFactor.detail) && calFactor.detail.includes(`±${GAP_CAL_CAP}`));
check("calibration never flips the favourite",
  pred.teamAWinProbability >= pred.teamBWinProbability);

// Near-level pairing: adjacent effective ratings → shift under 1 Elo → no factor.
let levelPair: [string, string] | null = null;
for (let i = 0; i + 1 < byElo.length && !levelPair; i++) {
  const d = getEffectiveRating(byElo[i]) - getEffectiveRating(byElo[i + 1]);
  if (d >= 0 && d < 2) levelPair = [byElo[i], byElo[i + 1]];
}
if (levelPair) {
  const lp = predictMatch(levelPair[0], levelPair[1]);
  check("near-level fixture shows NO calibration factor (it did nothing)",
    !lp.factors.some((f) => f.label.startsWith("Confidence calibration")));
} else {
  console.log("  (no near-level pairing in current ratings — skip, contract still covered above)");
}

console.log(`\nAll ${passed} confidence-calibration checks passed.`);
