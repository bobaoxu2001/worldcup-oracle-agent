/**
 * Model "evolution" — walk-forward parameter fitting against every completed
 * match. Run: npm run evolve
 *
 * This is the self-tuning companion to `npm run backtest`. It iterates over all
 * recorded results in date order, predicting each match from ONLY the results
 * before it, and grid-searches the model's two most impactful free knobs to
 * minimise out-of-sample log-loss:
 *
 *   gapScale   — global scaling of the favourite's Elo edge (1.0 = none;
 *                <1 compresses, >1 expands). The grid spans BOTH sides of 1.0
 *                so it detects systematic over- AND under-confidence in the
 *                strength model (the original compression-only grid could not
 *                see the under-confidence that showed up once knockout results
 *                landed — calibration bucket 60–80% observed 81%).
 *   drawBoost  — the group-stage draw-propensity multiplier (drawPropensity.ts).
 *
 * It prints the best combos + the full log-loss surface so the fitted values in
 * the engine can be justified (and re-fitted) as more matchdays land. The other
 * layers (result learning, confederation form, injuries, tactical) are applied
 * exactly as the live engine does, so this fits the WHOLE stack, not a toy.
 */

import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";
import { getRating, HOME_ADVANTAGE } from "../lib/prediction-engine/ratings";
import { computeRatingUpdates } from "../lib/prediction-engine/ratingUpdates";
import { getAvailabilityDelta } from "../lib/prediction-engine/availabilityAdjustments";
import { getTacticalMatchup } from "../lib/prediction-engine/tacticalMatchups";
import { GROUP_DRAW_BOOST, DRAW_CEIL, isGroupFixture } from "../lib/prediction-engine/drawPropensity";
import { GAP_SCALE } from "../lib/prediction-engine/confidenceCalibration";
import { matchProb, expectedScore } from "../lib/prediction-engine/elo";
import { HOST_SLUGS, getTeam } from "../lib/seed/world-cup-2026-groups";

const hb = (a: string, b: string) =>
  HOST_SLUGS.has(a) && !HOST_SLUGS.has(b) ? HOME_ADVANTAGE :
  HOST_SLUGS.has(b) && !HOST_SLUGS.has(a) ? -HOME_ADVANTAGE : 0;
const conf = (s: string) => getTeam(s).confederation;

function confedDeltas(rs: typeof MANUAL_MATCH_RESULTS): Record<string, number> {
  const sum: Record<string, number> = {}, cnt: Record<string, number> = {};
  for (const r of rs) {
    const eA = expectedScore(getRating(r.teamA), getRating(r.teamB), hb(r.teamA, r.teamB));
    const aA = r.scoreA > r.scoreB ? 1 : r.scoreA < r.scoreB ? 0 : 0.5;
    sum[conf(r.teamA)] = (sum[conf(r.teamA)] || 0) + (aA - eA); cnt[conf(r.teamA)] = (cnt[conf(r.teamA)] || 0) + 1;
    sum[conf(r.teamB)] = (sum[conf(r.teamB)] || 0) + ((1 - aA) - (1 - eA)); cnt[conf(r.teamB)] = (cnt[conf(r.teamB)] || 0) + 1;
  }
  const o: Record<string, number> = {};
  for (const c in cnt) { const n = cnt[c]; o[c] = Math.max(-20, Math.min(20, Math.round(50 * (sum[c] / n) * (n / (n + 4))))); }
  return o;
}
const openerW = (pc: number) => (pc <= 0 ? 1 : pc === 1 ? 0.6 : 0.4);
const all = [...MANUAL_MATCH_RESULTS].sort((x, y) => (x.date || "").localeCompare(y.date || ""));

function evalParams(scale: number, boost: number): { ll: number; br: number } {
  let ll = 0, br = 0;
  for (const m of all) {
    const priors = all.filter((r) => (r.date || "") < (m.date || ""));
    const dl = computeRatingUpdates(priors).deltas, cd = confedDeltas(priors), tac = getTacticalMatchup(m.teamA, m.teamB);
    const fA = getRating(m.teamA) + (dl[m.teamA] || 0) + (cd[conf(m.teamA)] || 0) + getAvailabilityDelta(m.teamA) + tac.a;
    const fB = getRating(m.teamB) + (dl[m.teamB] || 0) + (cd[conf(m.teamB)] || 0) + getAvailabilityDelta(m.teamB) + tac.b;
    const mid = (fA + fB) / 2, cA = mid + scale * (fA - mid), cB = mid + scale * (fB - mid);
    const p = matchProb(cA, cB, hb(m.teamA, m.teamB));
    const pset = new Set(priors.flatMap((r) => [r.teamA, r.teamB]));
    const pc = (pset.has(m.teamA) ? 1 : 0) + (pset.has(m.teamB) ? 1 : 0);
    const mult = isGroupFixture(m.teamA, m.teamB) ? 1 + boost * openerW(pc) : 1;
    let d = Math.min(p.draw * mult, DRAW_CEIL), wA = p.winA, wB = p.winB;
    if (d > p.draw) { const sc = (1 - d) / (1 - p.draw); wA *= sc; wB *= sc; }
    const yA = m.scoreA > m.scoreB ? 1 : 0, yD = m.scoreA === m.scoreB ? 1 : 0, yB = m.scoreB > m.scoreA ? 1 : 0;
    const pa = yA ? wA : yD ? d : wB; ll += -Math.log(Math.max(1e-9, pa));
    br += (wA - yA) ** 2 + (d - yD) ** 2 + (wB - yB) ** 2;
  }
  return { ll: ll / all.length, br: br / all.length };
}

const scales = [0.84, 0.92, 1.0, 1.08, 1.16, 1.24];
const boosts = [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36];
const grid = scales.flatMap((s) => boosts.map((b) => ({ s, b, ...evalParams(s, b) })));
grid.sort((x, y) => x.ll - y.ll);

const draws = all.filter((m) => m.scoreA === m.scoreB).length;
console.log(`Model evolution · walk-forward over ${all.length} matches · draw rate ${draws}/${all.length} (${(draws / all.length * 100).toFixed(0)}%)\n`);
console.log("Best 6 (gapScale, drawBoost) by LogLoss↓:");
for (const r of grid.slice(0, 6)) console.log(`  gapScale=${r.s.toFixed(2)} drawBoost=${r.b.toFixed(2)} → LogLoss ${r.ll.toFixed(4)}  Brier ${r.br.toFixed(4)}`);

const baseline = evalParams(1.0, 0);
// Live engine: GAP_SCALE from confidenceCalibration.ts (evalParams applies the
// scale uncapped; the engine's ±30/side cap only binds beyond a ~600 Elo gap,
// so the numbers match for every realistic fixture).
const live = evalParams(GAP_SCALE, GROUP_DRAW_BOOST);
console.log(`\nNo draw layer (1.00, 0.00):       LogLoss ${baseline.ll.toFixed(4)}  Brier ${baseline.br.toFixed(4)}`);
console.log(`Live engine   (${GAP_SCALE.toFixed(2)}, ${GROUP_DRAW_BOOST.toFixed(2)}):    LogLoss ${live.ll.toFixed(4)}  Brier ${live.br.toFixed(4)}`);

console.log("\nLogLoss surface (rows=gapScale, cols=drawBoost):");
console.log("        " + boosts.map((b) => b.toFixed(2).padStart(7)).join(""));
for (const s of scales) {
  let row = `${s.toFixed(2)}  `;
  for (const b of boosts) row += grid.find((x) => x.s === s && x.b === b)!.ll.toFixed(3).padStart(7);
  console.log(row);
}
const best = grid[0];
console.log(
  `\nGrid optimum: gapScale ${best.s.toFixed(2)}, drawBoost ${best.b.toFixed(2)}. ` +
    `Live engine runs gapScale ${GAP_SCALE} (confidenceCalibration.ts), drawBoost ${GROUP_DRAW_BOOST} — ` +
    `re-fit deliberately (shrunk toward 1.0 / the historical draw rate), never chased to the grid edge.`
);
