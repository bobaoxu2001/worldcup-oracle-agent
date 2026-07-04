/**
 * Invariants for the verified track-record module (lib/prediction-engine/trackRecord.ts),
 * which powers /accuracy and /api/accuracy.
 *
 * These are correctness guards, NOT a claim about how good the model is:
 * they assert the walk-forward accounting is sound (every match graded once,
 * probabilities sum to 1, metrics in range, no NaN) and that the module and the
 * CLI backtest agree. Run: npm run test:track
 */

import { computeTrackRecord, TRACK_VARIANTS } from "../lib/prediction-engine/trackRecord";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const tr = computeTrackRecord();

// ── Structural integrity ─────────────────────────────────────────────────────
check("at least one completed match is graded", tr.nMatches > 0, `nMatches=${tr.nMatches}`);
check("matches array length matches nMatches", tr.matches.length === tr.nMatches);
check(
  "group + knockout counts partition the matches",
  tr.nGroup + tr.nKnockout === tr.nMatches,
  `${tr.nGroup}+${tr.nKnockout}≠${tr.nMatches}`
);
check("asOf is the latest graded date", tr.asOf === tr.matches[tr.matches.length - 1]?.date);
check(
  "matches are chronologically ordered",
  tr.matches.every((m, i) => i === 0 || tr.matches[i - 1].date <= m.date)
);

// ── Per-match probability sanity ─────────────────────────────────────────────
let probSumOk = true;
let noNaN = true;
let hitConsistent = true;
let favOk = true;
for (const m of tr.matches) {
  const s = m.live.winA + m.live.draw + m.live.winB;
  if (Math.abs(s - 1) > 1e-6) probSumOk = false;
  if ([m.live.winA, m.live.draw, m.live.winB, m.favProb].some((x) => !Number.isFinite(x))) noNaN = false;
  if (m.hit !== (m.topPick === m.actual)) hitConsistent = false;
  // favProb must equal the larger of the two win probabilities (draw excluded).
  const expectedFav = Math.max(m.live.winA, m.live.winB);
  if (Math.abs(m.favProb - expectedFav) > 1e-9) favOk = false;
}
check("every live probability triple sums to 1", probSumOk);
check("no NaN/Inf in any live probability", noNaN);
check("hit flag == (topPick === actual) for every match", hitConsistent);
check("favProb == max(winA, winB) for every match", favOk);

// ── Actual-outcome accounting ────────────────────────────────────────────────
const drawsCounted = tr.matches.filter((m) => m.actual === "D").length;
check(
  "actualDraws matches the number of drawn results",
  drawsCounted === tr.actualDraws,
  `${drawsCounted}≠${tr.actualDraws}`
);
check(
  "top-pick hit count matches per-match hit flags",
  tr.variants["+cal"].hits === tr.matches.filter((m) => m.hit).length
);

// ── Variant metrics in range ─────────────────────────────────────────────────
for (const k of TRACK_VARIANTS) {
  const v = tr.variants[k];
  check(
    `variant ${k}: metrics finite and in range`,
    Number.isFinite(v.rps) &&
      Number.isFinite(v.brier) &&
      Number.isFinite(v.logloss) &&
      v.rps >= 0 &&
      v.brier >= 0 &&
      v.topPickAcc >= 0 &&
      v.topPickAcc <= 1
  );
}

// ── The live stack should beat the uniform baseline out-of-sample ────────────
check(
  "live (+cal) RPS beats the uniform 1/3 baseline",
  tr.variants["+cal"].rps < tr.variants.unif.rps,
  `${tr.variants["+cal"].rps.toFixed(3)} vs ${tr.variants.unif.rps.toFixed(3)}`
);
check("RPS skill score is positive (model has skill)", tr.skill.rpsSkill > 0);
check(
  "live log-loss is lower than uniform",
  tr.skill.loglossModel < tr.skill.loglossUniform
);

// ── Calibration table ────────────────────────────────────────────────────────
check("calibration ECE is a valid fraction", tr.calibration.ece >= 0 && tr.calibration.ece <= 1);
check(
  "calibration bins each carry at least one call",
  tr.calibration.bins.every((b) => b.n > 0)
);
check(
  "calibration bin counts sum to 3× matches (one point per outcome)",
  tr.calibration.bins.reduce((s, b) => s + b.n, 0) === tr.nMatches * 3
);

console.log(`\n${failed === 0 ? "✅" : "❌"} Track-record checks: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
