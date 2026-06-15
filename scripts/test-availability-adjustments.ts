/**
 * Sanity checks for the squad-availability Elo layer
 * (lib/prediction-engine/availabilityAdjustments.ts).
 * Run: npm run test:availability
 */

import {
  AVAILABILITY_ADJUSTMENTS,
  SQUAD_STABILITY_CAP,
  getAvailabilityDelta,
  getAvailabilityAdjustments,
  getEffectiveRating,
  availabilityMeta,
} from "../lib/prediction-engine/availabilityAdjustments";
import { getUpdatedRating } from "../lib/prediction-engine/ratingUpdates";
import { getConfederationDelta } from "../lib/prediction-engine/confederationForm";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// 1. Japan: three confirmed absences sum to a negative, capped delta.
const jp = getAvailabilityDelta("japan");
check("Japan availability delta is negative", jp < 0, `Δ=${jp}`);
check(
  "Japan delta = sum of its entries (within cap)",
  jp === Math.max(-SQUAD_STABILITY_CAP, Math.min(SQUAD_STABILITY_CAP,
    AVAILABILITY_ADJUSTMENTS.filter((a) => a.team === "japan").reduce((s, a) => s + a.delta, 0))),
);

// 2. Germany: smaller negative.
const de = getAvailabilityDelta("germany");
check("Germany availability delta is negative", de < 0, `Δ=${de}`);
check("Japan is hit harder than Germany", jp < de, `JP ${jp} < DE ${de}`);

// 3. Fully untouched team (no injuries, no completed results, no confederation
//    form on file): New Zealand (OFC has not played) → effective == base.
check("untouched team (New Zealand) has zero availability delta", getAvailabilityDelta("new-zealand") === 0);
check(
  "New Zealand effective rating unchanged (no results/availability/form)",
  getEffectiveRating("new-zealand") === getUpdatedRating("new-zealand"),
  `NZ ${getEffectiveRating("new-zealand")}`
);

// 4. Effective rating = results + availability + confederation form.
check(
  "Japan effective = updated + availability + confederation form",
  getEffectiveRating("japan") === getUpdatedRating("japan") + jp + getConfederationDelta("japan"),
  `${getUpdatedRating("japan")} ${jp >= 0 ? "+" : ""}${jp} (avail) +${getConfederationDelta("japan")} (form) = ${getEffectiveRating("japan")}`
);

// 5. The cap is never exceeded for any team on file.
const overCap = Array.from(new Set(AVAILABILITY_ADJUSTMENTS.map((a) => a.team))).filter(
  (t) => Math.abs(getAvailabilityDelta(t)) > SQUAD_STABILITY_CAP
);
check("no team exceeds the squad-stability cap", overCap.length === 0, `cap=${SQUAD_STABILITY_CAP}`);

// 6. Every entry is sourced (no unsourced real-name claims).
const unsourced = AVAILABILITY_ADJUSTMENTS.filter((a) => !a.source || !a.player);
check("every availability entry has a player + source", unsourced.length === 0);

// --- Report -----------------------------------------------------------------
const meta = availabilityMeta();
console.log(`\nAvailability entries: ${meta.entries} across ${meta.teams.length} team(s) (last: ${meta.lastUpdated})`);
for (const slug of meta.teams) {
  const players = getAvailabilityAdjustments(slug).map((a) => `${a.player} ${a.delta}`).join(", ");
  console.log(
    `  ${slug}: ${getUpdatedRating(slug)} → effective ${getEffectiveRating(slug)} (Δ ${getAvailabilityDelta(slug)}) [${players}]`
  );
}

console.log(failures === 0 ? "\nAll availability checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
