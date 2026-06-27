/**
 * Sanity checks for the completed-fixture lookup the agent uses to detect a
 * pairing that has ALREADY been played (lib/prediction-engine/completedFixtures.ts).
 * Run: npm run test:completed
 *
 * Result-driven, so it picks an unplayed pairing DYNAMICALLY (scan the groups for
 * a pairing with no recorded result) rather than hard-coding one that goes stale
 * as matchdays land. Once the group stage is COMPLETE (every within-group pairing
 * played), it falls back to a cross-group pairing for the "never recorded → null"
 * case — that pairing can never be seeded, so the contract still holds.
 */

import {
  getCompletedFixture,
  hasBeenPlayed,
  completedFixtureNote,
} from "../lib/prediction-engine/completedFixtures";
import { GROUPS, getTeam } from "../lib/seed/world-cup-2026-groups";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// Pick a played fixture dynamically (first recorded group pairing we can find).
let played: { a: string; b: string } | null = null;
let unplayed: { a: string; b: string } | null = null;
for (const g of GROUPS) {
  for (let i = 0; i < g.teams.length; i++) {
    for (let j = i + 1; j < g.teams.length; j++) {
      const a = g.teams[i], b = g.teams[j];
      if (getCompletedFixture(a, b)) played ??= { a, b };
      else unplayed ??= { a, b };
    }
  }
}
if (!played) throw new Error("expected at least one completed group fixture on file");
// Group stage complete → no within-group pairing is unplayed. Fall back to a
// cross-group pairing, which is never seeded as a group result either way.
const crossGroup = { a: "argentina", b: "brazil" };
const notPlayed = unplayed ?? crossGroup;

// 1. A played pairing resolves to a real, oriented result.
const r = getCompletedFixture(played.a, played.b)!;
check(
  `played pairing resolves (${getTeam(played.a).name} ${r.scoreA}–${r.scoreB} ${getTeam(played.b).name})`,
  Number.isInteger(r.scoreA) && Number.isInteger(r.scoreB)
);
check("hasBeenPlayed agrees for a played pairing", hasBeenPlayed(played.a, played.b));

// 2. Orientation: flipping the arguments flips the scores AND the outcome.
const flip = getCompletedFixture(played.b, played.a)!;
check("flipping arguments swaps the scores", flip.scoreA === r.scoreB && flip.scoreB === r.scoreA);
const flippedOutcome = r.outcome === "A" ? "B" : r.outcome === "B" ? "A" : "draw";
check("flipping arguments flips the outcome", flip.outcome === flippedOutcome, `${r.outcome} → ${flip.outcome}`);

// 3. Outcome agrees with the scoreline.
const expected = r.scoreA > r.scoreB ? "A" : r.scoreB > r.scoreA ? "B" : "draw";
check("outcome matches the scoreline", r.outcome === expected, r.outcome);

// 4. A pairing with no recorded result returns null / false (an unplayed
//    within-group pairing if one remains, else a cross-group pairing).
check(`unplayed pairing returns null (${getTeam(notPlayed.a).name} v ${getTeam(notPlayed.b).name})`, getCompletedFixture(notPlayed.a, notPlayed.b) === null);
check("hasBeenPlayed is false for an unplayed pairing", !hasBeenPlayed(notPlayed.a, notPlayed.b));

// 5. A cross-group pairing can never have a recorded (group-stage) result.
//    Argentina (J) and Brazil (C) only meet in the knockouts, which are never seeded.
check("cross-group pairing returns null", getCompletedFixture("argentina", "brazil") === null);

// 6. completedFixtureNote: real banner for a played game, empty string otherwise.
const note = completedFixtureNote(r, getTeam(played.a).name, getTeam(played.b).name, "en-US");
check("note leads with the 'already been played' banner", note.includes("already been played"));
check("note contains the actual scoreline", note.includes(`${r.scoreA}–${r.scoreB}`));
check("note is empty when the fixture has not been played", completedFixtureNote(null, "X", "Y", "en-US") === "");
check(
  "note localizes to zh-CN",
  completedFixtureNote(r, getTeam(played.a).name, getTeam(played.b).name, "zh-CN").includes("已经结束")
);

console.log(failures === 0 ? "\nAll completed-fixture checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
