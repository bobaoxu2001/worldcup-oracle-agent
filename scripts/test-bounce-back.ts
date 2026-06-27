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
import { getRating } from "../lib/prediction-engine/ratings";
import { getResultDelta } from "../lib/prediction-engine/ratingUpdates";
import { getEffectiveRating } from "../lib/prediction-engine/availabilityAdjustments";
import { GROUPS, getTeam } from "../lib/seed/world-cup-2026-groups";

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

// Live contract — discovered DYNAMICALLY so it never goes stale as results land.
// The layer keys on a side's CUMULATIVE result delta: a quality team only "needs
// to bounce back" while it is still net under-performing. Once it strings together
// wins (or the group stage is complete and deltas settle), it can stop qualifying —
// that is correct, not a regression. So we find a current example rather than
// hard-coding one team, and assert the contract on it; if none currently qualifies
// we say so and lean on the pure-function checks above.
let liveFav: { fav: string; weak: string; delta: number } | null = null;
for (const g of GROUPS) {
  const t = g.teams;
  for (let i = 0; i < t.length && !liveFav; i++) {
    for (let j = 0; j < t.length; j++) {
      if (i === j) continue;
      const fav = t[i], weak = t[j];
      if (
        getRating(fav) >= QUALITY_FLOOR &&
        getResultDelta(fav) < 0 &&
        getEffectiveRating(fav) - getEffectiveRating(weak) >= GAP_FLOOR
      ) {
        liveFav = { fav, weak, delta: getBounceBack(fav, weak) };
        break;
      }
    }
  }
}

if (liveFav) {
  const { fav, weak } = liveFav;
  const fwd = getBounceBack(fav, weak);
  check(
    `a currently under-performing quality side bounces back (${getTeam(fav).name} vs ${getTeam(weak).name})`,
    fwd > 0,
    `+${fwd}`
  );
  // …but the weaker side never gets it.
  check(
    `the weaker side does NOT get a bounce-back (${getTeam(weak).name} vs ${getTeam(fav).name})`,
    getBounceBack(weak, fav) === 0
  );
  console.log(`\nLive bounce-back: ${getTeam(fav).name} +${fwd} (vs ${getTeam(weak).name})`);
} else {
  console.log("\nℹ️  no side currently under-performing-and-favoured in any group — bounce-back idle (pure-function contract still verified above)");
}
console.log(failures === 0 ? "\nAll bounce-back checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
