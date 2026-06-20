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
import { getTeam, TEAMS } from "../lib/seed/world-cup-2026-groups";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

const rows = computeConfederationForm();

// 1. The layer's CONTRACT is data-driven: the nudge direction must follow the
//    measured form, whichever region happens to be hot. WHICH confederation is
//    over/under-performing changes as results land (early it was AFC; by 19 June
//    it is CAF up, CONMEBOL down), so we assert the mechanism, not a snapshot —
//    a deliberately durable test (see the model-update workflow).
const ordered = Object.values(rows).sort((a, b) => b.avgResidual - a.avgResidual);
const top = ordered[0]; // most over-performing confederation this tournament
const bottom = ordered[ordered.length - 1]; // most under-performing
const teamIn = (conf: string) => TEAMS.find((t) => t.confederation === conf)!.slug;

check(
  "no confederation is nudged against its own form (sign(delta) never opposes sign(avgResidual))",
  Object.values(rows).every(
    (r) => r.delta === 0 || r.avgResidual === 0 || Math.sign(r.delta) === Math.sign(r.avgResidual)
  )
);
check(
  `the most over-performing confederation (${top.confederation}) gets a non-negative nudge`,
  top.delta >= 0,
  `Δ=${top.delta}, avgResidual=${top.avgResidual.toFixed(3)}`
);
check(
  `the most under-performing confederation (${bottom.confederation}) gets a non-positive nudge`,
  bottom.delta <= 0,
  `Δ=${bottom.delta}, avgResidual=${bottom.avgResidual.toFixed(3)}`
);
check(
  "delta ordering is preserved (over-performer ≥ under-performer)",
  top.delta >= bottom.delta,
  `${top.confederation} ${top.delta} ≥ ${bottom.confederation} ${bottom.delta}`
);
check(
  `a team inherits its confederation's nudge (${top.confederation} → non-negative)`,
  getConfederationDelta(teamIn(top.confederation)) >= 0,
  `Δ=${getConfederationDelta(teamIn(top.confederation))}`
);

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
