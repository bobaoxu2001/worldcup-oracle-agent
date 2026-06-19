/**
 * Sanity checks for the round-2 bounce-back layer (lib/prediction-engine/bounceBack.ts).
 * Run: npm run test:bounce
 */

import {
  bounceBackDelta,
  getBounceBack,
  QUALITY_FLOOR,
  GAP_FLOOR,
  BOUNCE_CAP,
} from "../lib/prediction-engine/bounceBack";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// Gates --------------------------------------------------------------------
check("non-group fixture → 0", bounceBackDelta(1900, -20, 200, false) === 0);
check("a side that did NOT under-perform (delta ≥ 0) → 0", bounceBackDelta(1900, 5, 200, true) === 0);
check("a non-quality side (base < floor) → 0", bounceBackDelta(QUALITY_FLOOR - 50, -20, 200, true) === 0);
check("not the clearly stronger side (gap < floor) → 0", bounceBackDelta(1900, -20, GAP_FLOOR - 1, true) === 0);

// Fires & sized ------------------------------------------------------------
const d = bounceBackDelta(1900, -20, 200, true);
check("stumbled quality favourite vs weaker foe → positive nudge", d > 0, `+${d}`);
check("nudge is capped at BOUNCE_CAP", bounceBackDelta(1900, -200, 5000, true) <= BOUNCE_CAP, `cap=${BOUNCE_CAP}`);
check("never negative", bounceBackDelta(1900, -1, GAP_FLOOR, true) >= 0);
check(
  "bigger over-penalty → bigger (or equal) bounce-back",
  bounceBackDelta(1900, -30, 200, true) >= bounceBackDelta(1900, -10, 200, true)
);
check(
  "weaker opponent → bigger (or equal) motivation",
  bounceBackDelta(1900, -20, 300, true) >= bounceBackDelta(1900, -20, 100, true)
);

// Live: the two fixtures the user named should both fire for the favourite ----
const swiVsBos = getBounceBack("switzerland", "bosnia-and-herzegovina");
const canVsQat = getBounceBack("canada", "qatar");
check("Switzerland (drew Qatar) bounces back vs Bosnia", swiVsBos > 0, `+${swiVsBos}`);
check("Canada (drew Bosnia) bounces back vs Qatar", canVsQat > 0, `+${canVsQat}`);
// …but the weaker sides do NOT get it.
check("Bosnia does NOT get a bounce-back vs Switzerland", getBounceBack("bosnia-and-herzegovina", "switzerland") === 0);
check("Qatar does NOT get a bounce-back vs Canada", getBounceBack("qatar", "canada") === 0);

console.log(`\nLive bounce-backs: Switzerland +${swiVsBos} (vs Bosnia), Canada +${canVsQat} (vs Qatar)`);
console.log(failures === 0 ? "\nAll bounce-back checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
