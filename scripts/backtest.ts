/**
 * Walk-forward backtest of the prediction logic against completed results.
 * Run: npm run backtest
 *
 * For each completed match (date order), the model predicts it using ONLY the
 * results dated strictly before it — no peeking at its own outcome. Seven
 * cumulative variants are scored so the marginal value of each layer is visible:
 *
 *   unif       — uniform 1/3 baseline (sanity floor)
 *   base       — pure calibrated Elo (+ host bonus)
 *   old        — + completed-result learning (K=60) + confederation form
 *   full       — + value-weighted injuries + tactical matchup + bounce-back
 *   drawFlat   — + flat opener-weighted group-stage draw boost
 *   full+draw  — + kill-index dampener + low-block fortress term
 *   +cal       — + global confidence calibration — this is the LIVE engine stack
 *
 * Metrics: multiclass Brier (↓), the Ranked Probability Score / RPS (↓),
 * log-loss (↓), top-pick accuracy, and the average predicted draw probability vs
 * the actual draw rate.
 *
 * RPS is the football-forecasting standard (Constantinou & Fenton, 2012): unlike
 * Brier and log-loss it respects the ORDER of a 1X2 market (home → draw → away),
 * so a confident home call that ends in a draw is penalised less than the same
 * call ending in an away win. It is the headline accuracy number here.
 *
 * This is a thin CLI over lib/prediction-engine/trackRecord.ts — the SAME module
 * that powers the /accuracy page and /api/accuracy, so the terminal report and
 * the deployed page can never disagree.
 */

import { computeTrackRecord, TRACK_VARIANTS } from "../lib/prediction-engine/trackRecord";

const tr = computeTrackRecord();
const N = tr.nMatches;

console.log(
  `Walk-forward backtest · ${N} completed matches (each predicted from results strictly before it)\n`
);
console.log("✗ = model's top pick wrong (+cal live variant)\n");

for (const m of tr.matches) {
  const favName = m.favSlug === m.teamA ? m.nameA : m.nameB;
  const outc =
    m.actual === "D" ? "DRAW" : `${m.actual === "A" ? m.nameA : m.nameB} win`;
  console.log(
    `${m.hit ? "  " : "✗ "}${m.date.slice(5)} ${m.nameA.slice(0, 11).padEnd(11)} ${m.scoreA}-${m.scoreB} ${m.nameB.slice(0, 11).padEnd(11)} | ${favName.slice(0, 9).padEnd(9)} ${(m.favProb * 100).toFixed(0).padStart(2)}% win · draw ${(m.live.draw * 100).toFixed(0)}% → ${outc}`
  );
}

console.log(
  `\nActual draw rate: ${tr.actualDraws}/${N} = ${((tr.actualDraws / N) * 100).toFixed(0)}%`
);
console.log("\nVariant            Brier↓   RPS↓   LogLoss↓  TopPickAcc   AvgDrawPred");
for (const k of TRACK_VARIANTS) {
  const v = tr.variants[k];
  console.log(
    `${k.padEnd(18)} ${v.brier.toFixed(3)}  ${v.rps.toFixed(3)}   ${v.logloss.toFixed(3)}     ${(v.topPickAcc * 100).toFixed(0)}% (${v.hits}/${N})     ${(v.avgDrawPred * 100).toFixed(0)}%`
  );
}
console.log("(RPS is the ordinal-aware headline metric — see file header.)");

// ── Skill vs the uniform 1/3 baseline (live +cal model) ──────────────────────
console.log("\nSkill vs uniform 1/3 baseline (higher = better):");
console.log(`  Brier Skill Score: ${(1 - tr.variants["+cal"].brier / tr.variants.unif.brier).toFixed(3)}`);
console.log(`  RPS Skill Score:   ${tr.skill.rpsSkill.toFixed(3)}`);
console.log(
  `  LogLoss:           ${tr.skill.loglossModel.toFixed(3)} vs ${tr.skill.loglossUniform.toFixed(3)} uniform (${(
    (1 - tr.skill.loglossModel / tr.skill.loglossUniform) *
    100
  ).toFixed(0)}% lower)`
);

// ── Calibration / reliability of the live (+cal) model ───────────────────────
console.log("\nCalibration (live +cal model, all outcomes pooled):");
console.log("Pred bucket    n   MeanPred   Observed   Gap");
for (const b of tr.calibration.bins) {
  console.log(
    `${b.label.padEnd(11)} ${String(b.n).padStart(3)}   ${(b.meanPred * 100).toFixed(0).padStart(6)}%   ${(b.observed * 100).toFixed(0).padStart(6)}%   ${(b.gap >= 0 ? "+" : "") + (b.gap * 100).toFixed(0)}%`
  );
}
console.log(
  `Expected Calibration Error (ECE): ${(tr.calibration.ece * 100).toFixed(1)}%  (lower is better; 0 = perfectly calibrated)`
);
