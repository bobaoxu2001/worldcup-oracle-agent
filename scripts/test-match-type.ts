/**
 * Sanity checks for the V5.1 match-type classifier (lib/prediction-engine/matchType.ts).
 * Run: npm run test:matchtype
 */

import { classifyMatchType } from "../lib/prediction-engine/matchType";
import { predictMatch } from "../lib/prediction-engine";
import { getTeam } from "../lib/seed/world-cup-2026-groups";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}
const base = { favName: "Fav", dogName: "Dog" };

// D — no separation.
check(
  "near coin-flip → D",
  classifyMatchType({ ...base, favWin: 0.36, draw: 0.36, dogWin: 0.28, favKillIndex: 3, dogResistance: 3 }).code === "D"
);

// B — clear favourite with elite kill power.
check(
  "elite-kill favourite → B",
  classifyMatchType({ ...base, favWin: 0.5, draw: 0.3, dogWin: 0.2, favKillIndex: 4, dogResistance: 3 }).code === "B"
);
check(
  "very strong favourite with good kill → B",
  classifyMatchType({ ...base, favWin: 0.62, draw: 0.25, dogWin: 0.13, favKillIndex: 3, dogResistance: 2 }).code === "B"
);

// A — clear favourite but blunt / faces an elite block.
check(
  "blunt favourite → A (fade)",
  classifyMatchType({ ...base, favWin: 0.55, draw: 0.27, dogWin: 0.18, favKillIndex: 1, dogResistance: 3 }).code === "A"
);
check(
  "favourite vs elite low block → A (fade)",
  classifyMatchType({ ...base, favWin: 0.55, draw: 0.27, dogWin: 0.18, favKillIndex: 3, dogResistance: 5 }).code === "A"
);

// C — stronger favourite, real resistance, mid kill power.
check(
  "mid-kill favourite vs decent block → C (narrow)",
  classifyMatchType({ ...base, favWin: 0.5, draw: 0.3, dogWin: 0.2, favKillIndex: 3, dogResistance: 3 }).code === "C"
);

// Every classification carries a label + rationale.
const sample = classifyMatchType({ ...base, favWin: 0.5, draw: 0.3, dogWin: 0.2, favKillIndex: 4, dogResistance: 3 });
check("classification has a non-empty label + rationale", !!sample.label && sample.rationale.length > 10);

// --- Live labels on the 8 tracked fixtures (report) -------------------------
console.log("\nMatch-type labels on the current fixtures:");
const fixtures: [string, string][] = [
  ["portugal", "dr-congo"], ["england", "croatia"], ["ghana", "panama"], ["uzbekistan", "colombia"],
  ["czech-republic", "south-africa"], ["switzerland", "bosnia-and-herzegovina"], ["canada", "qatar"], ["mexico", "south-korea"],
];
for (const [a, b] of fixtures) {
  const p = predictMatch(a, b);
  const mt = p.matchType!;
  check(
    `${getTeam(a).name} vs ${getTeam(b).name}: ${mt.code} (${mt.label})`,
    ["A", "B", "C", "D"].includes(mt.code),
    `${(p.teamAWinProbability * 100).toFixed(0)}/${(p.drawProbability * 100).toFixed(0)}/${(p.teamBWinProbability * 100).toFixed(0)}`
  );
}

console.log(failures === 0 ? "\nAll match-type checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
