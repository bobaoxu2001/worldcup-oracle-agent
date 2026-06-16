/**
 * Sanity checks + retrospective probe for the tactical-matchup Elo layer
 * (lib/prediction-engine/tacticalMatchups.ts).
 * Run: npm run test:tactical
 */

import {
  TEAM_STYLES,
  NEUTRAL_STYLE,
  TACTICAL_CAP,
  getStyle,
  getTacticalMatchup,
} from "../lib/prediction-engine/tacticalMatchups";
import { getRating } from "../lib/prediction-engine/ratings";
import { getAvailabilityDelta } from "../lib/prediction-engine/availabilityAdjustments";
import { matchProb } from "../lib/prediction-engine/elo";
import { getTeam } from "../lib/seed/world-cup-2026-groups";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// 1. Every documented style attribute is in range 0–5.
const allStyles = [NEUTRAL_STYLE, ...Object.values(TEAM_STYLES)];
const inRange = allStyles.every(
  (s) => s.lowBlock >= 0 && s.lowBlock <= 5 && s.breakdown >= 0 && s.breakdown <= 5
);
check("all style attributes are within 0–5", inRange);

// 2. The signal is zero-sum within a fixture (a = −b) and never exceeds the cap.
let zeroSumOk = true;
let capOk = true;
const slugs = Object.keys(TEAM_STYLES);
for (const a of slugs) {
  for (const b of slugs) {
    if (a === b) continue;
    const m = getTacticalMatchup(a, b);
    if (m.a !== -m.b) zeroSumOk = false;
    if (Math.abs(m.a) > TACTICAL_CAP) capOk = false;
  }
}
check("tactical signal is zero-sum within every fixture (a = −b)", zeroSumOk);
check("tactical signal never exceeds the cap", capOk, `cap=±${TACTICAL_CAP}`);

// 3. Anti-symmetry: swapping sides flips the sign.
const sc = getTacticalMatchup("spain", "cape-verde");
const cs = getTacticalMatchup("cape-verde", "spain");
check("swapping sides flips the sign", sc.a === -cs.a, `ESP→CV ${sc.a}, CV→ESP ${cs.a}`);

// 4. Two tactically-neutral teams produce no edge.
const neutralPair = getTacticalMatchup("__none_x", "__none_y");
check("two unprofiled (neutral) teams → zero edge", !neutralPair.active && neutralPair.a === 0);

// 5. The headline case: Cape Verde's low block frustrates Spain.
check(
  "Spain is penalised vs Cape Verde's low block",
  sc.a < 0 && sc.b > 0,
  `ESP ${sc.a}, CV ${sc.b}`
);

// 6. A favourite who is GOOD at breaking blocks suffers less than one who is not.
//    France (breakdown 4) vs Iran (lowBlock 4) should be hit less than
//    Germany (breakdown 3) vs Iran.
const frIran = getTacticalMatchup("france", "iran").a; // France's nudge
const deIran = getTacticalMatchup("germany", "iran").a; // Germany's nudge
check(
  "elite block-breaker (France) is dented less by a low block than Germany",
  frIran >= deIran,
  `FRA ${frIran} ≥ GER ${deIran} vs Iran`
);

// --- Retrospective probe: how the new signals move the PRE-MATCH line --------
// Old line = pure base strength (host bonus 0 for these neutral-ish fixtures).
// New line = base + value-weighted injuries + tactical matchup (no result feed,
// to isolate exactly what the two new ideas contribute pre-match).
console.log("\n— 15 June retrospective: pure-strength line → new (injury + tactical) line —");
const fixtures: [string, string][] = [
  ["spain", "cape-verde"],
  ["saudi-arabia", "uruguay"],
  ["belgium", "egypt"],
];
for (const [a, b] of fixtures) {
  const old = matchProb(getRating(a), getRating(b), 0);
  const tac = getTacticalMatchup(a, b);
  const neu = matchProb(
    getRating(a) + getAvailabilityDelta(a) + tac.a,
    getRating(b) + getAvailabilityDelta(b) + tac.b,
    0
  );
  const nameA = getTeam(a).name;
  const nameB = getTeam(b).name;
  const fav = old.winA >= old.winB ? nameA : nameB;
  const favOld = Math.max(old.winA, old.winB);
  const favNew = old.winA >= old.winB ? neu.winA : neu.winB;
  console.log(
    `  ${nameA} vs ${nameB} (actual: draw)\n` +
      `      ${fav} win  ${(favOld * 100).toFixed(0)}% → ${(favNew * 100).toFixed(0)}%   |   ` +
      `draw ${(old.draw * 100).toFixed(0)}% → ${(neu.draw * 100).toFixed(0)}%   |   ` +
      `tactical ${getTeam(a).name} ${tac.a >= 0 ? "+" : ""}${tac.a}, ${getTeam(b).name} ${tac.b >= 0 ? "+" : ""}${tac.b}`
  );
}

// --- Style table dump --------------------------------------------------------
console.log("\nStyle profiles on file (lowBlock / breakdown):");
for (const slug of slugs) {
  const s = getStyle(slug);
  console.log(`  ${slug}: LB ${s.lowBlock} · BD ${s.breakdown} — ${s.note}`);
}

console.log(failures === 0 ? "\nAll tactical-matchup checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
