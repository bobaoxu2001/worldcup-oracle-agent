/**
 * Sanity checks for post-match Elo rating updates (lib/prediction-engine/ratingUpdates.ts).
 * Run: npm run test:ratings
 */

import {
  computeRatingUpdates,
  getUpdatedRating,
  getResultDelta,
  ratingUpdatesMeta,
} from "../lib/prediction-engine/ratingUpdates";
import { getRating } from "../lib/prediction-engine/ratings";
import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// --- Pure-function checks -------------------------------------------------

// 1. No completed results → updated rating equals base rating.
const empty = computeRatingUpdates([]);
check(
  "no results → zero deltas",
  Object.keys(empty.deltas).length === 0 && empty.resultsUsed === 0
);

// 2. A single win moves the winner up and the loser down, zero-sum.
const single = computeRatingUpdates([
  { teamA: "mexico", teamB: "south-africa", scoreA: 2, scoreB: 0, date: "2026-06-11" },
]);
check("Mexico 2–0 → Mexico delta > 0", single.deltas["mexico"] > 0, `Δ=${single.deltas["mexico"].toFixed(2)}`);
check("Mexico 2–0 → South Africa delta < 0", single.deltas["south-africa"] < 0, `Δ=${single.deltas["south-africa"].toFixed(2)}`);
check(
  "match deltas are zero-sum",
  Math.abs(single.deltas["mexico"] + single.deltas["south-africa"]) < 1e-9
);

const korCze = computeRatingUpdates([
  { teamA: "south-korea", teamB: "czech-republic", scoreA: 2, scoreB: 1, date: "2026-06-12" },
]);
check("South Korea 2–1 → South Korea delta > 0", korCze.deltas["south-korea"] > 0, `Δ=${korCze.deltas["south-korea"].toFixed(2)}`);
check("South Korea 2–1 → Czech Republic delta < 0", korCze.deltas["czech-republic"] < 0, `Δ=${korCze.deltas["czech-republic"].toFixed(2)}`);
check(
  "match deltas are zero-sum",
  Math.abs(korCze.deltas["south-korea"] + korCze.deltas["czech-republic"]) < 1e-9
);

// 3. A draw moves the higher-rated side down (it underperformed expectation).
const draw = computeRatingUpdates([
  { teamA: "south-korea", teamB: "czech-republic", scoreA: 0, scoreB: 0 },
]);
check("draw → higher-Elo side loses points", draw.deltas["south-korea"] < 0 && draw.deltas["czech-republic"] > 0);

// 4. Untouched team: updated rating equals base. (Spain — Group H, not yet played.)
check(
  "untouched team rating unchanged",
  getUpdatedRating("spain") === getRating("spain"),
  `Spain ${getRating("spain")}`
);

// --- Applied (seed) checks ------------------------------------------------

const meta = ratingUpdatesMeta();
console.log(`\nSeed results applied: ${meta.resultsUsed} (last: ${meta.lastResultDate})`);
for (const slug of ["mexico", "south-africa", "south-korea", "czech-republic"]) {
  console.log(
    `  ${slug}: base ${getRating(slug)} → updated ${getUpdatedRating(slug)} (Δ ${getResultDelta(slug) >= 0 ? "+" : ""}${getResultDelta(slug)})`
  );
}
check("seed has completed results", meta.resultsUsed === MANUAL_MATCH_RESULTS.length);
check("Mexico rating increased", getResultDelta("mexico") > 0);
check("South Africa rating decreased", getResultDelta("south-africa") < 0);
check("South Korea rating increased", getResultDelta("south-korea") > 0);
check("Czech Republic rating decreased", getResultDelta("czech-republic") < 0);

console.log(failures === 0 ? "\nAll rating-update checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
