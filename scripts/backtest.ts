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
 *   +cal       — + global confidence calibration (capped gap expansion,
 *                confidenceCalibration.ts) — this is the LIVE engine stack
 *
 * Metrics: multiclass Brier (↓), the Ranked Probability Score / RPS (↓),
 * log-loss (↓), top-pick accuracy, and the average predicted draw probability vs
 * the actual draw rate. A uniform 1/3 baseline is included as a sanity floor.
 *
 * RPS is the football-forecasting standard (Constantinou & Fenton, 2012): unlike
 * Brier and log-loss it respects the ORDER of a 1X2 market (home → draw → away),
 * so a confident home call that ends in a draw is penalised less than the same
 * call ending in an away win. It is the headline accuracy number here.
 *
 * A reliability/calibration table for the live (full+draw) model is printed last:
 * every outcome probability is pooled and binned, so we can see whether, e.g.,
 * outcomes the model calls "70%" actually happen ~70% of the time.
 */

import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";
import { getRating, HOME_ADVANTAGE } from "../lib/prediction-engine/ratings";
import { computeRatingUpdates } from "../lib/prediction-engine/ratingUpdates";
import { getAvailabilityDelta } from "../lib/prediction-engine/availabilityAdjustments";
import { getTacticalMatchup, getStyle } from "../lib/prediction-engine/tacticalMatchups";
import { drawMultiplierFor, inflateDraw, isGroupFixture } from "../lib/prediction-engine/drawPropensity";
import { bounceBackDelta } from "../lib/prediction-engine/bounceBack";
import { gapCalibration } from "../lib/prediction-engine/confidenceCalibration";
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

interface Agg { brier: number; rps: number; logloss: number; hits: number; drawPred: number; }
const mk = (): Agg => ({ brier: 0, rps: 0, logloss: 0, hits: 0, drawPred: 0 });
const VARIANTS = ["unif", "base", "old", "full", "drawFlat", "full+draw", "+cal"] as const;
const V: Record<string, Agg> = Object.fromEntries(VARIANTS.map((k) => [k, mk()]));

/**
 * Ranked Probability Score for an ordered 3-outcome market [winA, draw, winB].
 * RPS = (1/(r-1)) · Σ_{i<r} ( Σ_{j≤i}(p_j − e_j) )², r = 3 categories. Lower is
 * better; it rewards getting the ORDER right, not just the exact bucket.
 */
const rps3 = (p: { winA: number; draw: number; winB: number }, yA: number, yD: number) => {
  const c1 = p.winA - yA; // cumulative through "home"
  const c2 = p.winA + p.draw - (yA + yD); // cumulative through "home or draw"
  return (c1 * c1 + c2 * c2) / 2;
};

/** Pooled (predicted prob, did-it-happen) points for the live model's reliability table. */
const calib: { p: number; hit: number }[] = [];

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
  // Walk-forward bounce-back: uses each side's prior-results delta + the effective
  // gap. Fires only for stumbled quality favourites (so only from round 2 on).
  const effA = oldA + getAvailabilityDelta(m.teamA);
  const effB = oldB + getAvailabilityDelta(m.teamB);
  const bounceA = bounceBackDelta(baseA, dl[m.teamA] || 0, effA - effB, isGroup);
  const bounceB = bounceBackDelta(baseB, dl[m.teamB] || 0, effB - effA, isGroup);
  const fullA = effA + tac.a + bounceA;
  const fullB = effB + tac.b + bounceB;

  const pBase = matchProb(baseA, baseB, bonus);
  const pOld = matchProb(oldA, oldB, bonus);
  const pFull = matchProb(fullA, fullB, bonus);
  // drawFlat = flat opener-weighted boost; full+draw = + kill-index dampener
  // (favourite's breakdown shrinks the boost for elite attacks) + matchday-
  // invariant low-block fortress term (underdog's bus the favourite can't break).
  const favStyle = pFull.winA >= pFull.winB ? getStyle(m.teamA) : getStyle(m.teamB);
  const dogStyle = pFull.winA >= pFull.winB ? getStyle(m.teamB) : getStyle(m.teamA);
  const favKill = favStyle.breakdown;
  const busResist = Math.max(0, dogStyle.lowBlock - favStyle.breakdown);
  const drawMultFlat = drawMultiplierFor(isGroup, playedCount);
  const drawMultDamped = drawMultiplierFor(isGroup, playedCount, favKill, busResist);
  const pDrawFlat = inflateDraw(pFull.winA, pFull.draw, pFull.winB, drawMultFlat);
  const pDraw = inflateDraw(pFull.winA, pFull.draw, pFull.winB, drawMultDamped);
  // Live stack: the same full ratings pushed through the global confidence
  // calibration (capped gap expansion) BEFORE the draw layer — mirrors engine.ts.
  const cal = gapCalibration(fullA, fullB);
  const pCalRaw = matchProb(fullA + cal.a, fullB + cal.b, bonus);
  const pCal = inflateDraw(pCalRaw.winA, pCalRaw.draw, pCalRaw.winB, drawMultDamped);
  const probs: Record<string, { winA: number; draw: number; winB: number }> = {
    unif: { winA: 1 / 3, draw: 1 / 3, winB: 1 / 3 },
    base: pBase, old: pOld, full: pFull,
    drawFlat: { winA: pDrawFlat.winA, draw: pDrawFlat.draw, winB: pDrawFlat.winB },
    "full+draw": { winA: pDraw.winA, draw: pDraw.draw, winB: pDraw.winB },
    "+cal": { winA: pCal.winA, draw: pCal.draw, winB: pCal.winB },
  };

  const yA = m.scoreA > m.scoreB ? 1 : 0, yD = m.scoreA === m.scoreB ? 1 : 0, yB = m.scoreB > m.scoreA ? 1 : 0;
  const act = yA ? "A" : yD ? "D" : "B";
  for (const k of VARIANTS) {
    const p = probs[k];
    V[k].brier += (p.winA - yA) ** 2 + (p.draw - yD) ** 2 + (p.winB - yB) ** 2;
    V[k].rps += rps3(p, yA, yD);
    const pa = yA ? p.winA : yD ? p.draw : p.winB;
    V[k].logloss += -Math.log(Math.max(1e-9, pa));
    const top = p.winA >= p.draw && p.winA >= p.winB ? "A" : p.draw >= p.winB ? "D" : "B";
    if (top === act) V[k].hits++;
    V[k].drawPred += p.draw;
  }
  // Reliability points for the live (+cal) model: each outcome's predicted
  // probability paired with whether that outcome actually occurred.
  const live = probs["+cal"];
  calib.push({ p: live.winA, hit: yA }, { p: live.draw, hit: yD }, { p: live.winB, hit: yB });

  const pf = probs["+cal"];
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
console.log("✗ = model's top pick wrong (+cal live variant)\n");
console.log(rows.join("\n"));
console.log(`\nActual draw rate: ${actualDraws}/${N} = ${(actualDraws / N * 100).toFixed(0)}%`);
console.log("\nVariant            Brier↓   RPS↓   LogLoss↓  TopPickAcc   AvgDrawPred");
for (const k of VARIANTS) {
  const a = V[k];
  console.log(`${k.padEnd(18)} ${(a.brier / N).toFixed(3)}  ${(a.rps / N).toFixed(3)}   ${(a.logloss / N).toFixed(3)}     ${(a.hits / N * 100).toFixed(0)}% (${a.hits}/${N})     ${(a.drawPred / N * 100).toFixed(0)}%`);
}
console.log("(RPS is the ordinal-aware headline metric — see file header.)");

// ── Skill vs the uniform 1/3 baseline (live +cal model) ──────────────────────
// Skill score = 1 − model/reference; >0 means the model beats a no-information
// 1/3-1/3-1/3 forecast. The ratio is sample-size invariant, so no /N is needed.
{
  const m = V["+cal"], ref = V["unif"];
  const bss = 1 - m.brier / ref.brier;
  const rpss = 1 - m.rps / ref.rps;
  const llCut = (1 - m.logloss / ref.logloss) * 100;
  console.log("\nSkill vs uniform 1/3 baseline (higher = better):");
  console.log(`  Brier Skill Score: ${bss.toFixed(3)}`);
  console.log(`  RPS Skill Score:   ${rpss.toFixed(3)}`);
  console.log(`  LogLoss:           ${(m.logloss / N).toFixed(3)} vs ${(ref.logloss / N).toFixed(3)} uniform (${llCut.toFixed(0)}% lower)`);
}

// ── Calibration / reliability of the live (+cal) model ───────────────────────
// Bin the pooled outcome probabilities and compare mean predicted prob to the
// observed frequency in each bin. Close columns ⇒ well-calibrated probabilities.
const bins = [
  { lo: 0.0, hi: 0.2, label: "00–20%" },
  { lo: 0.2, hi: 0.4, label: "20–40%" },
  { lo: 0.4, hi: 0.6, label: "40–60%" },
  { lo: 0.6, hi: 0.8, label: "60–80%" },
  { lo: 0.8, hi: 1.01, label: "80–100%" },
];
console.log("\nCalibration (live +cal model, all outcomes pooled):");
console.log("Pred bucket    n   MeanPred   Observed   Gap");
let ece = 0;
for (const b of bins) {
  const pts = calib.filter((c) => c.p >= b.lo && c.p < b.hi);
  if (!pts.length) continue;
  const meanPred = pts.reduce((s, c) => s + c.p, 0) / pts.length;
  const observed = pts.reduce((s, c) => s + c.hit, 0) / pts.length;
  ece += (pts.length / calib.length) * Math.abs(meanPred - observed);
  const gap = observed - meanPred;
  console.log(
    `${b.label.padEnd(11)} ${String(pts.length).padStart(3)}   ${(meanPred * 100).toFixed(0).padStart(6)}%   ${(observed * 100).toFixed(0).padStart(6)}%   ${(gap >= 0 ? "+" : "") + (gap * 100).toFixed(0)}%`
  );
}
console.log(`Expected Calibration Error (ECE): ${(ece * 100).toFixed(1)}%  (lower is better; 0 = perfectly calibrated)`);
