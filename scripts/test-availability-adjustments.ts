/**
 * Sanity checks for the squad-availability Elo layer
 * (lib/prediction-engine/availabilityAdjustments.ts).
 * Run: npm run test:availability
 */

import {
  AVAILABILITY_ADJUSTMENTS,
  SQUAD_STABILITY_CAP,
  entryDelta,
  getAvailabilityDelta,
  getAvailabilityAdjustments,
  getEffectiveRating,
  availabilityMeta,
} from "../lib/prediction-engine/availabilityAdjustments";
import { getUpdatedRating, getResultDelta } from "../lib/prediction-engine/ratingUpdates";
import { getConfederationDelta } from "../lib/prediction-engine/confederationForm";
import { GROUPS } from "../lib/seed/world-cup-2026-groups";

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
    AVAILABILITY_ADJUSTMENTS.filter((a) => a.team === "japan").reduce((s, a) => s + entryDelta(a), 0))),
);

// 1b. Value-driven hits (no explicit delta) — Spain (Yamal) and Uruguay (CBs).
const es = getAvailabilityDelta("spain");
const uy = getAvailabilityDelta("uruguay");
check("Spain availability delta is negative (Yamal, value-driven)", es < 0, `Δ=${es}`);
check("Uruguay availability delta is negative (Araújo + Giménez)", uy < 0, `Δ=${uy}`);
check(
  "Uruguay's thin CB depth is hit harder than Spain's deep front line",
  uy < es,
  `URU ${uy} < ESP ${es}`
);
check(
  "entryDelta is value-driven when no explicit delta is set",
  entryDelta({ team: "x", player: "p", marketValueOut: 100, replacementValue: 20, role: "defense", fractionOut: 1, reason: "", source: "", date: "" }) < 0,
);
check(
  "a loss can never make a team stronger (net value floored at 0)",
  entryDelta({ team: "x", player: "p", marketValueOut: 10, replacementValue: 50, reason: "", source: "", date: "" }) === 0,
);
check(
  "explicit delta wins over value fields",
  entryDelta({ team: "x", player: "p", delta: -7, marketValueOut: 100, reason: "", source: "", date: "" }) === -7,
);

// 2. Germany: smaller negative.
const de = getAvailabilityDelta("germany");
check("Germany availability delta is negative", de < 0, `Δ=${de}`);
check("Japan is hit harder than Germany", jp < de, `JP ${jp} < DE ${de}`);

// 3. Decomposition on an INJURY-FREE team — picked DYNAMICALLY so the check does
//    not go stale as results land each matchday. For any team with no injuries,
//    the availability layer adds nothing, so effective = updated (base+results)
//    + confederation form. (No longer requires a not-yet-played team, since every
//    group has now opened — getUpdatedRating already carries the result delta.)
const allSlugs = GROUPS.flatMap((g) => g.teams);
const injuryFree = allSlugs.find((s) => getAvailabilityDelta(s) === 0);
check("an injury-free team exists to test", !!injuryFree, injuryFree ?? "none");
if (injuryFree) {
  check(
    `${injuryFree} effective = updated + confederation form (no injuries)`,
    getEffectiveRating(injuryFree) === getUpdatedRating(injuryFree) + getConfederationDelta(injuryFree),
    `${getEffectiveRating(injuryFree)} = ${getUpdatedRating(injuryFree)} + ${getConfederationDelta(injuryFree)} (form)`
  );
}

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
  const players = getAvailabilityAdjustments(slug).map((a) => `${a.player} ${entryDelta(a)}`).join(", ");
  console.log(
    `  ${slug}: ${getUpdatedRating(slug)} → effective ${getEffectiveRating(slug)} (Δ ${getAvailabilityDelta(slug)}) [${players}]`
  );
}

console.log(failures === 0 ? "\nAll availability checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
