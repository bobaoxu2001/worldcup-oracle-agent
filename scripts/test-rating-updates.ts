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
import { GROUPS } from "../lib/seed/world-cup-2026-groups";

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

// 4. Result-learning only ever moves teams that have actually PLAYED. Stated as
//    an invariant (not "find an unplayed team") so it stays valid even once every
//    group has opened and no untouched team is left — and still catches the bug
//    it guards against (a team with no results getting a nonzero delta).
const played = new Set(MANUAL_MATCH_RESULTS.flatMap((m) => [m.teamA, m.teamB]));
const allTeams = GROUPS.flatMap((g) => g.teams);
const ghosts = allTeams.filter((s) => !played.has(s) && getResultDelta(s) !== 0);
check("no unplayed team has a result delta (staleness guard)", ghosts.length === 0, ghosts.join(", ") || "none");
const unplayed = allTeams.find((s) => !played.has(s));
if (unplayed) {
  check(
    `untouched team rating unchanged (${unplayed})`,
    getUpdatedRating(unplayed) === getRating(unplayed),
    `${unplayed} ${getRating(unplayed)}`
  );
} else {
  console.log("ℹ️  every group has opened — no untouched team remains (invariant above still holds)");
}

// --- Applied (seed) checks ------------------------------------------------

const meta = ratingUpdatesMeta();
console.log(`\nSeed results applied: ${meta.resultsUsed} (last: ${meta.lastResultDate})`);
for (const slug of ["mexico", "south-africa", "south-korea", "czech-republic"]) {
  console.log(
    `  ${slug}: base ${getRating(slug)} → updated ${getUpdatedRating(slug)} (Δ ${getResultDelta(slug) >= 0 ? "+" : ""}${getResultDelta(slug)})`
  );
}
check("seed has completed results", meta.resultsUsed === MANUAL_MATCH_RESULTS.length);

// Directional checks derived DYNAMICALLY from each team's actual record (not
// hardcoded names), so they stay valid as more matchdays land: a team with only
// wins must have gained rating; a team with only losses must have lost rating.
const record: Record<string, { w: number; l: number; d: number }> = {};
for (const m of MANUAL_MATCH_RESULTS) {
  const aWin = m.scoreA > m.scoreB, bWin = m.scoreB > m.scoreA;
  for (const [t, win, loss] of [[m.teamA, aWin, bWin], [m.teamB, bWin, aWin]] as const) {
    (record[t] ??= { w: 0, l: 0, d: 0 });
    if (win) record[t].w++; else if (loss) record[t].l++; else record[t].d++;
  }
}
const perfectWinner = Object.keys(record).find((t) => record[t].w > 0 && record[t].l === 0 && record[t].d === 0);
const winlessLoser = Object.keys(record).find((t) => record[t].l > 0 && record[t].w === 0 && record[t].d === 0);
if (perfectWinner) check(`an all-wins team gained rating (${perfectWinner})`, getResultDelta(perfectWinner) > 0, `Δ ${getResultDelta(perfectWinner)}`);
if (winlessLoser) check(`an all-losses team lost rating (${winlessLoser})`, getResultDelta(winlessLoser) < 0, `Δ ${getResultDelta(winlessLoser)}`);

console.log(failures === 0 ? "\nAll rating-update checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
