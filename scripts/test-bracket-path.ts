/**
 * Tests for the knockout-path explainer.
 * Run: npm run test:path
 *
 * Asserts STRUCTURAL invariants of the projected bracket (deterministic, robust
 * to which team finishes where): every group winner lands in exactly one of the
 * four quarters, three winners per quarter, paths run R32→Final in order with an
 * exact R32 opponent, and a non-qualifier returns an empty path.
 */

import {
  projectSeeding,
  knockoutPath,
  quarterFields,
  describePath,
} from "../lib/prediction-engine/bracketPath";
import { getEffectiveRating } from "../lib/prediction-engine/availabilityAdjustments";
import { GROUPS, getTeam } from "../lib/seed/world-cup-2026-groups";

let pass = 0;
let fail = 0;
const ok = (c: boolean, m: string) => {
  if (c) {
    pass++;
    console.log(`✅ ${m}`);
  } else {
    fail++;
    console.log(`❌ ${m}`);
  }
};

const seeding = projectSeeding();

console.log("— Seeding —");
ok(Object.keys(seeding).length === 12, "projected seeding covers all 12 groups");
ok(
  GROUPS.every((g) => {
    const o = seeding[g.name as "A"];
    return o.length === 4 && new Set(o).size === 4;
  }),
  "every group has 4 distinct ordered finishers"
);

console.log("\n— Quarter fields —");
const quarters = quarterFields(seeding);
ok(quarters.length === 4, "there are 4 quarter regions");
ok(
  quarters.every((q) => q.winners.length === 3),
  "each quarter contains exactly 3 group winners (12 winners / 4)"
);
const allWinners = quarters.flatMap((q) => q.winners);
ok(new Set(allWinners).size === 12, "the 4 quarters cover all 12 group winners exactly once");
ok(
  quarters.every((q) => q.difficulty > 0 && q.topTeams.length === 3),
  "each quarter has a positive difficulty score and a top-3"
);

console.log("\n— Paths —");
const ROUNDS = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"];
let winnersOk = true;
for (const g of GROUPS) {
  const winner = seeding[g.name as "A"][0];
  const p = knockoutPath(winner, seeding);
  const roundsInOrder = p.steps.map((s) => s.round).join(",") === ROUNDS.join(",");
  if (p.qualifiedAs !== "1st" || p.quarter < 1 || p.quarter > 4 || !roundsInOrder || !p.steps[0].exact) {
    winnersOk = false;
    console.log(`   ↳ ${getTeam(winner).name}: as=${p.qualifiedAs} q=${p.quarter} steps=${p.steps.length}`);
  }
}
ok(winnersOk, "every group winner: qualified 1st, quarter 1–4, path R32→Final in order, exact R32 opp");

// Strongest qualified team has a full 5-leg path and an exact R32 opponent.
const favourite = [...GROUPS.flatMap((g) => g.teams)].sort(
  (a, b) => getEffectiveRating(b) - getEffectiveRating(a)
)[0];
const fp = knockoutPath(favourite, seeding);
ok(fp.steps.length === 5, `tournament favourite (${getTeam(favourite).name}) has a 5-round path`);
ok(fp.steps[0].exact && !fp.steps[4].exact, "R32 opponent is exact; later rounds are projected");

// A projected 4th-place team is not in the R32 field.
const fourth = seeding[GROUPS[0].name as "A"][3];
const f4 = knockoutPath(fourth, seeding);
ok(f4.qualifiedAs === null && f4.steps.length === 0, "a projected 4th-place team has no knockout path");

console.log("\n— describePath —");
ok(describePath(favourite, seeding).includes(getTeam(favourite).name), "describePath names the team");

console.log(`\n${fail === 0 ? "All bracket-path checks passed." : `${fail} CHECK(S) FAILED`}`);
if (fail > 0) process.exit(1);
