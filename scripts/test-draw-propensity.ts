/**
 * Sanity checks for the group-stage draw-propensity layer
 * (lib/prediction-engine/drawPropensity.ts).
 * Run: npm run test:draw
 */

import {
  GROUP_DRAW_BOOST,
  DRAW_CEIL,
  KILL_DAMP_FLOOR,
  KILL_DAMP_THRESHOLD,
  isGroupFixture,
  drawMultiplierFor,
  killDampFactor,
  inflateDraw,
  applyDrawPropensity,
} from "../lib/prediction-engine/drawPropensity";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}
const approx = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

// 1. isGroupFixture: same group true, cross-group false.
check("same-group pair is a group fixture", isGroupFixture("spain", "cape-verde"));
check("cross-group pair is NOT a group fixture", !isGroupFixture("spain", "france"));

// 2. Multiplier: non-group = 1; group opener > one-played > both-played > 1.
check("non-group multiplier is 1", drawMultiplierFor(false, 0) === 1);
const mOpener = drawMultiplierFor(true, 0);
const mOne = drawMultiplierFor(true, 1);
const mBoth = drawMultiplierFor(true, 2);
check("opener gets the full boost", approx(mOpener, 1 + GROUP_DRAW_BOOST), `×${mOpener.toFixed(3)}`);
check("boost tapers as teams play", mOpener > mOne && mOne > mBoth && mBoth > 1, `${mOpener.toFixed(2)} > ${mOne.toFixed(2)} > ${mBoth.toFixed(2)}`);

// Kill-index dampener: ordinary favourites unaffected; elite attacks (breakdown
// ≥ threshold+1) get a smaller boost, floored so the cushion is never erased.
check("kill damp leaves ordinary favourites alone", approx(killDampFactor(KILL_DAMP_THRESHOLD), 1));
check("kill damp shrinks the boost for an elite attack", killDampFactor(4) < 1, `×${killDampFactor(4).toFixed(2)}`);
check("kill damp never falls below the floor", killDampFactor(5) >= KILL_DAMP_FLOOR - 1e-9, `floor=${KILL_DAMP_FLOOR}`);
const mEliteFav = drawMultiplierFor(true, 0, 4);
check("elite-kill favourite's opener boost is dampened vs flat", mEliteFav < mOpener && mEliteFav > 1, `${mEliteFav.toFixed(3)} < ${mOpener.toFixed(3)}`);

// Low-block fortress term: a bus the favourite can't break adds draw mass, and
// (unlike the opener boost) it does NOT taper away by matchday.
const mNoBus = drawMultiplierFor(true, 2, 2, 0);
const mBus = drawMultiplierFor(true, 2, 2, 3);
check("fortress term adds draw mass over a no-bus matchup", mBus > mNoBus, `${mBus.toFixed(3)} > ${mNoBus.toFixed(3)}`);
const busOpener = drawMultiplierFor(true, 0, 2, 3) - drawMultiplierFor(true, 0, 2, 0);
const busLate = drawMultiplierFor(true, 2, 2, 3) - drawMultiplierFor(true, 2, 2, 0);
check("fortress term is matchday-invariant (round 1 == round 3)", approx(busOpener, busLate), `${busOpener.toFixed(3)} vs ${busLate.toFixed(3)}`);
const fort = applyDrawPropensity({ winA: 0.8, draw: 0.15, winB: 0.05 }, "spain", "cape-verde");
check("profiled bus (Spain v Cape Verde) flags the low-block boost", fort.lowBlockBoost && fort.applied);
const noFort = applyDrawPropensity({ winA: 0.8, draw: 0.15, winB: 0.05 }, "germany", "curacao");
check("non-bus matchup (Germany v Curaçao) does not flag the low-block boost", !noFort.lowBlockBoost);

// 3. inflateDraw: draw rises, wins shrink proportionally, sum stays 1, favourite preserved.
const r = inflateDraw(0.55, 0.25, 0.20, mOpener);
check("draw probability increases", r.draw > 0.25, `${(0.25).toFixed(2)}→${r.draw.toFixed(3)}`);
check("three outcomes still sum to 1", approx(r.winA + r.draw + r.winB, 1));
check("both win probs shrink", r.winA < 0.55 && r.winB < 0.20);
check(
  "win-odds ratio (favourite) is preserved",
  approx(r.winA / r.winB, 0.55 / 0.20, 1e-6),
  `${(r.winA / r.winB).toFixed(3)} vs ${(0.55 / 0.20).toFixed(3)}`
);
check("argmax (favourite side) unchanged", r.winA > r.winB);

// 4. Ceiling: a high base draw cannot be pushed past DRAW_CEIL.
const hi = inflateDraw(0.30, 0.40, 0.30, 1.5);
check("draw is capped at the ceiling", hi.draw <= DRAW_CEIL + 1e-9, `draw=${hi.draw.toFixed(3)} ceil=${DRAW_CEIL}`);

// 5. Non-group fixtures are returned unchanged by applyDrawPropensity.
const cross = applyDrawPropensity({ winA: 0.5, draw: 0.25, winB: 0.25 }, "spain", "france");
check("cross-group fixture is untouched", !cross.applied && approx(cross.draw, 0.25));

// 6. mult ≤ 1 is a no-op.
const noop = inflateDraw(0.5, 0.25, 0.25, 1);
check("multiplier of 1 leaves the distribution unchanged", !noop.applied && approx(noop.draw, 0.25));

console.log(failures === 0 ? "\nAll draw-propensity checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
