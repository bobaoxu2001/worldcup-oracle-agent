/**
 * Walk-forward backtest of the prediction logic against completed results.
 * Run: npm run backtest
 *
 * For each completed match (date order), the model predicts it using ONLY the
 * results dated strictly before it — no peeking at its own outcome. We then
 * score four cumulative model variants against the actual results so the
 * marginal value of each layer is visible:
 *
 *   base       — pure calibrated Elo (+ host bonus)
 *   old        — + completed-result learning (K=60) + confederation form
 *   full       — + value-weighted injuries + tactical matchup
 *   full+draw  — + group-stage draw-propensity correction (opener-weighted)
 *
 * Metrics: multiclass Brier (↓), log-loss (↓), top-pick accuracy, and the
 * average predicted draw probability vs the actual draw rate. A uniform 1/3
 * baseline is included as a sanity floor.
 */

import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";
import { getRating, HOME_ADVANTAGE } from "../lib/prediction-engine/ratings";
import { computeRatingUpdates } from "../lib/prediction-engine/ratingUpdates";
import { getAvailabilityDelta } from "../lib/prediction-engine/availabilityAdjustments";
import { getTacticalMatchup, getStyle } from "../lib/prediction-engine/tacticalMatchups";
import { drawMultiplierFor, inflateDraw, isGroupFixture } from "../lib/prediction-engine/drawPropensity";
import { matchProb, expectedScore } from "../lib/prediction-engine/elo";
import { HOST_SLUGS, getTeam } from "../lib/seed/world-cup-2026-groups";

const hb = (a: string, b: string) =>
  HOST_SLUGS.has(a) && !HOST_SLUGS.has(b) ? HOME_ADVANTAGE :
  HOST_SLUGS.has(b) && !HOST_SLUGS.has(a) ? -HOME_ADVANTAGE : 0;
const conf = (s: string) => getTeam(s).confederation;
const nm = (s: string) => getTeam(s).name;

/** Confederation-form deltas computed from a subset of results (walk-forward). */
function confedDeltas(results: typeof MANUAL_MATCH_RESULTS): Record<string, number> {
  const sum: Record<string, number> = {}, cnt: Record<string, number> = {};
  for (const r of results) {
    const eA = expectedScore(getRating(r.teamA), getRating(r.teamB), hb(r.teamA, r.teamB));
    const aA = r.scoreA > r.scoreB ? 1 : r.scoreA < r.scoreB ? 0 : 0.5;
    sum[conf(r.teamA)] = (sum[conf(r.teamA)] || 0) + (aA - eA); cnt[conf(r.teamA)] = (cnt[conf(r.teamA)] || 0) + 1;
    sum[conf(r.teamB)] = (sum[conf(r.teamB)] || 0) + ((1 - aA) - (1 - eA)); cnt[conf(r.teamB)] = (cnt[conf(r.teamB)] || 0) + 1;
  }
  const out: Record<string, number> = {};
  for (const c in cnt) { const n = cnt[c]; out[c] = Math.max(-20, Math.min(20, Math.round(50 * (sum[c] / n) * (n / (n + 4))))); }
  return out;
}

interface Agg { brier: number; logloss: number; hits: number; drawPred: number; }
const mk = (): Agg => ({ brier: 0, logloss: 0, hits: 0, drawPred: 0 });
const VARIANTS = ["unif", "base", "old", "full", "drawFlat", "full+draw"] as const;
const V: Record<string, Agg> = Object.fromEntries(VARIANTS.map((k) => [k, mk()]));

const all = [...MANUAL_MATCH_RESULTS].sort((x, y) => (x.date || "").localeCompare(y.date || ""));
const rows: string[] = [];

for (const m of all) {
  const priors = all.filter((r) => (r.date || "") < (m.date || ""));
  const dl = computeRatingUpdates(priors).deltas;
  const cd = confedDeltas(priors);
  const tac = getTacticalMatchup(m.teamA, m.teamB);
  const bonus = hb(m.teamA, m.teamB);
  // Walk-forward played count for the draw multiplier.
  const playedSet = new Set(priors.flatMap((r) => [r.teamA, r.teamB]));
  const playedCount = (playedSet.has(m.teamA) ? 1 : 0) + (playedSet.has(m.teamB) ? 1 : 0);
  const isGroup = isGroupFixture(m.teamA, m.teamB);

  const baseA = getRating(m.teamA), baseB = getRating(m.teamB);
  const oldA = baseA + (dl[m.teamA] || 0) + (cd[conf(m.teamA)] || 0);
  const oldB = baseB + (dl[m.teamB] || 0) + (cd[conf(m.teamB)] || 0);
  const fullA = oldA + getAvailabilityDelta(m.teamA) + tac.a;
  const fullB = oldB + getAvailabilityDelta(m.teamB) + tac.b;

  const pBase = matchProb(baseA, baseB, bonus);
  const pOld = matchProb(oldA, oldB, bonus);
  const pFull = matchProb(fullA, fullB, bonus);
  // drawFlat = flat opener-weighted boost; full+draw = + kill-index dampener
  // (the favourite's tactical breakdown shrinks the boost for elite attacks).
  const favKill = (pFull.winA >= pFull.winB ? getStyle(m.teamA) : getStyle(m.teamB)).breakdown;
  const drawMultFlat = drawMultiplierFor(isGroup, playedCount);
  const drawMultDamped = drawMultiplierFor(isGroup, playedCount, favKill);
  const pDrawFlat = inflateDraw(pFull.winA, pFull.draw, pFull.winB, drawMultFlat);
  const pDraw = inflateDraw(pFull.winA, pFull.draw, pFull.winB, drawMultDamped);
  const probs: Record<string, { winA: number; draw: number; winB: number }> = {
    unif: { winA: 1 / 3, draw: 1 / 3, winB: 1 / 3 },
    base: pBase, old: pOld, full: pFull,
    drawFlat: { winA: pDrawFlat.winA, draw: pDrawFlat.draw, winB: pDrawFlat.winB },
    "full+draw": { winA: pDraw.winA, draw: pDraw.draw, winB: pDraw.winB },
  };

  const yA = m.scoreA > m.scoreB ? 1 : 0, yD = m.scoreA === m.scoreB ? 1 : 0, yB = m.scoreB > m.scoreA ? 1 : 0;
  const act = yA ? "A" : yD ? "D" : "B";
  for (const k of VARIANTS) {
    const p = probs[k];
    V[k].brier += (p.winA - yA) ** 2 + (p.draw - yD) ** 2 + (p.winB - yB) ** 2;
    const pa = yA ? p.winA : yD ? p.draw : p.winB;
    V[k].logloss += -Math.log(Math.max(1e-9, pa));
    const top = p.winA >= p.draw && p.winA >= p.winB ? "A" : p.draw >= p.winB ? "D" : "B";
    if (top === act) V[k].hits++;
    V[k].drawPred += p.draw;
  }

  const pf = probs["full+draw"];
  const favName = pf.winA >= pf.winB ? nm(m.teamA) : nm(m.teamB);
  const favP = Math.max(pf.winA, pf.winB);
  const outc = yD ? "DRAW" : (yA ? nm(m.teamA) : nm(m.teamB)) + " win";
  const top = pf.winA >= pf.draw && pf.winA >= pf.winB ? "A" : pf.draw >= pf.winB ? "D" : "B";
  rows.push(
    `${top === act ? "  " : "✗ "}${m.date!.slice(5)} ${nm(m.teamA).slice(0, 11).padEnd(11)} ${m.scoreA}-${m.scoreB} ${nm(m.teamB).slice(0, 11).padEnd(11)} | ${favName.slice(0, 9).padEnd(9)} ${(favP * 100).toFixed(0).padStart(2)}% win · draw ${(pf.draw * 100).toFixed(0)}% → ${outc}`
  );
}

const N = all.length;
const actualDraws = all.filter((m) => m.scoreA === m.scoreB).length;
console.log(`Walk-forward backtest · ${N} completed matches (each predicted from results strictly before it)\n`);
console.log("✗ = model's top pick wrong (full+draw variant)\n");
console.log(rows.join("\n"));
console.log(`\nActual draw rate: ${actualDraws}/${N} = ${(actualDraws / N * 100).toFixed(0)}%`);
console.log("\nVariant            Brier↓  LogLoss↓  TopPickAcc   AvgDrawPred");
for (const k of VARIANTS) {
  const a = V[k];
  console.log(`${k.padEnd(18)} ${(a.brier / N).toFixed(3)}   ${(a.logloss / N).toFixed(3)}     ${(a.hits / N * 100).toFixed(0)}% (${a.hits}/${N})     ${(a.drawPred / N * 100).toFixed(0)}%`);
}
