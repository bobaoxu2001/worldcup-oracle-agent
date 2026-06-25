/**
 * Tests for the final-round match-stakes (rotation) layer.
 * Run: npm run test:stakes
 *
 * The pure classifier (classifyStakes) is tested with SYNTHETIC group scenarios
 * so the asserts are deterministic and never go stale as real results land. The
 * engine-facing checks are CONTRACT-based on whatever fixtures are still to play
 * (e.g. "every rotation nudge is ≤ 0", "a settled leader is trimmed, a side
 * still racing is not"), discovered dynamically rather than hard-coded to a team.
 */

import {
  classifyStakes,
  matchStakesDelta,
  getMatchStakes,
  getMatchStakesState,
  ROTATION_CAP,
  ROTATION_WEIGHT,
  DEFAULT_ROTATION_TENDENCY,
  type StakesState,
} from "../lib/prediction-engine/matchStakes";
import { predictMatch } from "../lib/prediction-engine/engine";
import { getCompletedFixture } from "../lib/prediction-engine/completedFixtures";
import { GROUPS, getTeam } from "../lib/seed/world-cup-2026-groups";

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) {
    pass++;
    console.log(`✅ ${msg}`);
  } else {
    fail++;
    console.log(`❌ ${msg}`);
  }
}

// Final-round pairing convention used in the synthetic tests: t0–t3 and t1–t2.
const FINAL: [string, string][] = [
  ["t0", "t3"],
  ["t1", "t2"],
];

console.log("— Pure classifier (synthetic groups) —");

// Comfortable secured leader (Argentina-type): 6 / 3 / 3 / 0, plays the bottom side.
ok(
  classifyStakes("t0", { t0: 6, t1: 3, t2: 3, t3: 0 }, FINAL) === "comfortable",
  "secured leader 3 clear, 1st still live → 'comfortable' (rotation)"
);

// Live race for first (France/Norway-type): two leaders level on 6 who PLAY each other.
ok(
  classifyStakes("t0", { t0: 6, t1: 6, t2: 0, t3: 0 }, [["t0", "t1"], ["t2", "t3"]]) ===
    "race-for-first",
  "two leaders level on 6 meeting each other → 'race-for-first' (full strength)"
);

// Clinched the group (uncatchable): 6 vs 1 / 1 / 0 → guaranteed first.
ok(
  classifyStakes("t0", { t0: 6, t1: 1, t2: 1, t3: 0 }, FINAL) === "settled-top",
  "leader uncatchable for 1st → 'settled-top' (rotation)"
);

// Still must get a result (not secured): mid-table scramble.
ok(
  classifyStakes("t0", { t0: 3, t1: 6, t2: 4, t3: 1 }, FINAL) === "must-play",
  "not yet guaranteed top-two → 'must-play' (full strength)"
);

// Gate: more than the final game remains → not modelled.
ok(
  classifyStakes("t0", { t0: 3, t1: 3, t2: 0, t3: 0 }, [
    ["t0", "t2"],
    ["t0", "t3"],
    ["t1", "t2"],
    ["t1", "t3"],
  ]) === "early",
  "two games left for the team → 'early' (no nudge)"
);

// Gate: group finished → done.
ok(classifyStakes("t0", { t0: 6, t1: 4, t2: 3, t3: 1 }, []) === "done", "no games left → 'done'");

console.log("\n— Nudge sizing —");
ok(matchStakesDelta("must-play") === 0, "'must-play' → 0 nudge");
ok(matchStakesDelta("race-for-first") === 0, "'race-for-first' → 0 nudge");
ok(matchStakesDelta("settled-top") < 0, "'settled-top' → negative nudge");
ok(matchStakesDelta("comfortable") < 0, "'comfortable' → negative nudge");
ok(
  Math.abs(matchStakesDelta("comfortable")) < Math.abs(matchStakesDelta("settled-top")),
  "comfortable is trimmed less than a fully-settled side"
);
ok(matchStakesDelta("settled-top") >= -ROTATION_CAP, "nudge never exceeds the cap");
ok(
  matchStakesDelta("settled-top", 0) === 0 && matchStakesDelta("settled-top", 1) < 0,
  "rotation tendency scales the nudge (0 → none, 1 → full)"
);
ok(ROTATION_WEIGHT["race-for-first"] === 0 && ROTATION_WEIGHT["settled-top"] === 1, "weights are sane");

console.log("\n— Engine contract on still-to-play group fixtures —");
// Gather every group pairing without a recorded result (the upcoming fixtures).
const upcoming: [string, string][] = [];
for (const g of GROUPS) {
  const t = g.teams;
  for (let i = 0; i < t.length; i++)
    for (let j = i + 1; j < t.length; j++)
      if (!getCompletedFixture(t[i], t[j])) upcoming.push([t[i], t[j]]);
}

ok(upcoming.length > 0, `there are upcoming group fixtures to check (${upcoming.length})`);
ok(
  upcoming.every(([a, b]) => getMatchStakes(a, b) <= 0 && getMatchStakes(b, a) <= 0),
  "every rotation nudge is ≤ 0 (it only ever trims, never inflates)"
);

const ROTATING: StakesState[] = ["settled-top", "settled-second", "comfortable"];
const FULL: StakesState[] = ["must-play", "race-for-first"];
let sawRotation = false;
let sawFull = false;
for (const [a, b] of upcoming) {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ] as const) {
    const st = getMatchStakesState(x, y);
    if (ROTATING.includes(st)) {
      sawRotation = true;
      ok(
        getMatchStakes(x, y) < 0,
        `${getTeam(x).name} (${st}) is trimmed for rotation vs ${getTeam(y).name}`
      );
    }
    if (FULL.includes(st) && !sawFull) {
      sawFull = true;
      ok(
        getMatchStakes(x, y) === 0,
        `${getTeam(x).name} (${st}) is left at full strength vs ${getTeam(y).name}`
      );
    }
  }
  if (sawRotation && sawFull) break;
}
if (!sawRotation) console.log("ℹ️  no team currently in a settled/comfortable state (all races still live)");

// Breakdown + factor surface the layer when it fires.
const flagged = upcoming.find(
  ([a, b]) => getMatchStakes(a, b) < 0 || getMatchStakes(b, a) < 0
);
if (flagged) {
  const pred = predictMatch(flagged[0], flagged[1]);
  const stk =
    (pred.eloBreakdown.a.matchStakesAdjustment ?? 0) +
    (pred.eloBreakdown.b.matchStakesAdjustment ?? 0);
  ok(stk < 0, "predictMatch eloBreakdown carries the matchStakesAdjustment");
  ok(
    pred.factors.some((f) => f.label === "Match stakes (rotation risk)"),
    "predictMatch lists a 'Match stakes (rotation risk)' factor"
  );
}

console.log(`\nDefault rotation tendency: ${DEFAULT_ROTATION_TENDENCY}`);
console.log(`\n${fail === 0 ? "All match-stakes checks passed." : `${fail} CHECK(S) FAILED`}`);
if (fail > 0) process.exit(1);
