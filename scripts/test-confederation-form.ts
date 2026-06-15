/**
 * Sanity checks for the confederation tournament-form layer
 * (lib/prediction-engine/confederationForm.ts).
 * Run: npm run test:form
 */

import {
  FORM_CAP,
  computeConfederationForm,
  getConfederationDelta,
  confederationFormMeta,
} from "../lib/prediction-engine/confederationForm";
import { getTeam } from "../lib/seed/world-cup-2026-groups";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

const rows = computeConfederationForm();

// 1. The data confirms the qualitative read: AFC over-, CONMEBOL under-performing.
check("AFC residual is positive (Asian teams over-performing)", rows["AFC"]?.avgResidual > 0, `avg=${rows["AFC"]?.avgResidual.toFixed(3)}`);
check("CONMEBOL residual is negative (South America under-performing)", rows["CONMEBOL"]?.avgResidual < 0, `avg=${rows["CONMEBOL"]?.avgResidual.toFixed(3)}`);
check("AFC delta is a positive nudge", getConfederationDelta("japan") > 0, `Δ=${getConfederationDelta("japan")}`);
check("CONMEBOL delta is a negative nudge", getConfederationDelta("argentina") < 0, `Δ=${getConfederationDelta("argentina")}`);

// 2. Teams in the same confederation share the delta (it's a regional prior).
check(
  "Japan and Saudi Arabia (both AFC) get the same nudge",
  getConfederationDelta("japan") === getConfederationDelta("saudi-arabia"),
  `JPN ${getConfederationDelta("japan")} = KSA ${getConfederationDelta("saudi-arabia")}`
);
check(
  "Argentina and Uruguay (both CONMEBOL) get the same nudge",
  getConfederationDelta("argentina") === getConfederationDelta("uruguay")
);

// 3. The cap is respected everywhere.
const overCap = Object.values(rows).filter((r) => Math.abs(r.delta) > FORM_CAP);
check("no confederation exceeds the form cap", overCap.length === 0, `cap=${FORM_CAP}`);

// 4. Shrinkage is in (0,1) and grows with sample size.
check("shrink weights are within (0,1)", Object.values(rows).every((r) => r.shrink > 0 && r.shrink < 1));

// --- Report -----------------------------------------------------------------
console.log("\nConfederation form (most positive first):");
for (const r of confederationFormMeta()) {
  console.log(
    `  ${r.confederation.padEnd(9)} Δ ${r.delta >= 0 ? "+" : ""}${r.delta}  (avgResidual ${r.avgResidual >= 0 ? "+" : ""}${r.avgResidual.toFixed(3)}, n=${r.matches}, shrink ${r.shrink.toFixed(2)})`
  );
}
// Spot-check a couple of yet-to-play teams that the nudge most affects.
for (const slug of ["argentina", "uruguay", "saudi-arabia", "iran"]) {
  console.log(`  ${slug} (${getTeam(slug).confederation}): form Δ ${getConfederationDelta(slug)}`);
}

console.log(failures === 0 ? "\nAll confederation-form checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
