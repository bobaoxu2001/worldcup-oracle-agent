/**
 * Sanity checks for the pre-match intelligence layer
 * (lib/prediction-engine/preMatchIntelligence.ts).
 * Run: npm run test:intel
 */

import {
  PRE_MATCH_INTEL,
  INTEL_CAP,
  intelEloImpact,
  getIntelDelta,
  getConfirmedIntel,
  getIntelUncertainty,
  getFixtureIntel,
  preMatchIntelligenceMeta,
} from "../lib/prediction-engine/preMatchIntelligence";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// 1. Provenance: every entry is sourced, has a confidence in [0,1] and a status.
const unsourced = PRE_MATCH_INTEL.filter((e) => !e.sourceUrl || !e.sourceName);
check("every intel entry has a source name + url", unsourced.length === 0, `${unsourced.length} unsourced`);
const badConf = PRE_MATCH_INTEL.filter((e) => !(e.confidence >= 0 && e.confidence <= 1));
check("every confidence is within [0,1]", badConf.length === 0);
const okStatus = PRE_MATCH_INTEL.every((e) => ["confirmed", "rumor", "opinion"].includes(e.status));
check("every entry has a valid status (confirmed/rumor/opinion)", okStatus);
check("every entry is time-boxed (expiresAfterMatch)", PRE_MATCH_INTEL.every((e) => e.expiresAfterMatch === true));

// 2. ONLY confirmed items move the model: a fixture with only rumour/opinion
//    yields a zero delta. Portugal vs DR Congo has no confirmed model-mover.
check(
  "rumour/opinion-only side contributes zero model delta (DR Congo)",
  getIntelDelta("dr-congo", "portugal") === 0
);

// 3. Confirmed deltas move the model and are correctly signed (negative = weaker).
const ghanaVsPanama = getIntelDelta("ghana", "panama");
check("Ghana is weakened vs Panama (Partey barred for this match)", ghanaVsPanama < 0, `Δ=${ghanaVsPanama}`);
const canadaVsQatar = getIntelDelta("canada", "qatar");
check("Canada is weakened vs Qatar (Davies out)", canadaVsQatar < 0, `Δ=${canadaVsQatar}`);
const saVsCzech = getIntelDelta("south-africa", "czech-republic");
check("South Africa weakened vs Czechia (two suspensions)", saVsCzech < 0, `Δ=${saVsCzech}`);

// 4. MATCH-SPECIFICITY (the key requirement): Partey's absence touches ONLY the
//    Panama game, not Ghana's later fixtures.
check("Partey intel does NOT leak to Ghana vs England", getIntelDelta("ghana", "england") === 0);
check("Partey intel does NOT leak to Ghana vs Croatia", getIntelDelta("ghana", "croatia") === 0);
check("Davies intel does NOT leak to Canada vs Switzerland", getIntelDelta("canada", "switzerland") === 0);

// 5. The per-team per-fixture delta never exceeds the cap.
const pairs = PRE_MATCH_INTEL.map((e) => [e.team, e.opponent] as [string, string]);
const overCap = pairs.filter(([t, o]) => Math.abs(getIntelDelta(t, o)) > INTEL_CAP);
check("no fixture delta exceeds the cap", overCap.length === 0, `cap=±${INTEL_CAP}`);

// 6. intelEloImpact sums the components.
check(
  "intelEloImpact sums deltaElo + deltaAttack + deltaDefense",
  intelEloImpact({ deltaElo: -2, deltaAttack: -6, deltaDefense: -3 } as any) === -11
);

// 6b. Probabilistic availability scales the impact (a doubt is not a 100% out).
check(
  "availabilityProb scales the full-out impact",
  Math.round(intelEloImpact({ deltaAttack: -12, availabilityProb: 0.25 } as any)) === -9
);
check(
  "Davies is modelled as a doubt, not a full withdrawal (|Δ| < full 12)",
  Math.abs(getIntelDelta("canada", "qatar")) < 12 && getIntelDelta("canada", "qatar") < 0,
  `Δ=${getIntelDelta("canada", "qatar")}`
);

// 6c. Rúben Dias is now confirmed out vs DR Congo (Portugal weakened).
check("Portugal weakened vs DR Congo (Dias confirmed out)", getIntelDelta("portugal", "dr-congo") < 0, `Δ=${getIntelDelta("portugal", "dr-congo")}`);

// 7. Uncertainty multiplier is in (0.85, 1].
const u = getIntelUncertainty("canada", "qatar");
check("intel uncertainty multiplier is in [0.85, 1]", u >= 0.85 && u <= 1, `×${u.toFixed(3)}`);

// 8. getConfirmedIntel only returns confirmed, model-moving items.
const conf = getConfirmedIntel("south-africa", "czech-republic");
check("getConfirmedIntel returns only confirmed movers", conf.every((e) => e.status === "confirmed" && intelEloImpact(e) !== 0), `${conf.length} items`);

// --- Report -----------------------------------------------------------------
const meta = preMatchIntelligenceMeta();
console.log(`\nIntel: ${meta.entries} entries (${meta.confirmed} confirmed, ${meta.rumorOrOpinion} rumour/opinion) across ${meta.fixtures} fixtures`);
for (const [a, b] of [
  ["ghana", "panama"], ["canada", "qatar"], ["south-africa", "czech-republic"],
  ["mexico", "south-korea"], ["england", "croatia"],
] as [string, string][]) {
  const d = getIntelDelta(a, b);
  const items = getFixtureIntel(a, b).length;
  console.log(`  ${a} vs ${b}: ${a} confirmed Δ ${d >= 0 ? "+" : ""}${d} Elo · ${items} item(s) on file`);
}

console.log(failures === 0 ? "\nAll pre-match-intel checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
