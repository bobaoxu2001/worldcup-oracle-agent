/**
 * V5.1 MATCH-TYPE CLASSIFIER — a derived label that names HOW a fixture is
 * likely to play out, on top of the raw 1X2 numbers.
 *
 * This adds no new model signal; it READS the engine's own outputs (the
 * favourite's win probability + the tactical Kill Index / Resistance Index that
 * already drive the prediction) and maps them onto the four archetypes from the
 * V5.1 skill, so the prediction explains its *shape*, not just its odds:
 *
 *   A — Fade Favourite      : a clear favourite that lacks the tools to break a
 *                             resistant underdog (blunt attack OR elite block).
 *   B — Trust Favourite     : a favourite with real kill power to break the block.
 *   C — Favourite Wins Narrow: stronger side likely wins, but resistance is real.
 *   D — Coin-Flip / Draw-Heavy: no side has meaningful separation.
 *
 * Kill Index  = the favourite's tactical `breakdown` (ability to unpick a block).
 * Resistance  = the underdog's tactical `lowBlock` (deep-block quality).
 *
 * Thresholds are deliberately simple and tuned to this engine's output range
 * (favourites top out ~60–65%, draws ~25–40% under the group draw layer). Pure
 * and side-agnostic so it is trivially testable.
 */

import type { MatchTypeClassification } from "@/lib/types";

export interface MatchTypeInput {
  /** Favourite's win probability (the larger of the two win probs). */
  favWin: number;
  draw: number;
  /** Underdog's win probability. */
  dogWin: number;
  /** Favourite's Kill Index (tactical breakdown, 0–5). */
  favKillIndex: number;
  /** Underdog's Resistance (tactical lowBlock, 0–5). */
  dogResistance: number;
  favName: string;
  dogName: string;
}

/** No meaningful separation below this favourite win probability. */
export const COINFLIP_FAV_CEIL = 0.45;
/** A breakdown at/above this is an "elite" attack able to break a block. */
export const ELITE_KILL = 4;
/** A breakdown at/below this is a "blunt" attack. */
export const BLUNT_KILL = 2;
/** A lowBlock at/above this is an "elite" resistant block. */
export const ELITE_RESISTANCE = 4;

export function classifyMatchType(i: MatchTypeInput): MatchTypeClassification {
  const favPct = Math.round(i.favWin * 100);
  const drawPct = Math.round(i.draw * 100);

  // D — no real separation: nobody is a clear favourite.
  if (i.favWin < COINFLIP_FAV_CEIL) {
    return {
      code: "D",
      label: "Coin-Flip / Draw-Heavy",
      rationale: `No side separates (${i.favName} only ${favPct}%, draw ${drawPct}%) — a true toss-up where the draw and a one-goal game either way are all live.`,
    };
  }

  // B — Trust Favourite: the favourite can actually break the underdog.
  const eliteKill = i.favKillIndex >= ELITE_KILL;
  const strongFavWithKill = i.favWin >= 0.58 && i.favKillIndex >= ELITE_KILL - 1;
  if (eliteKill || strongFavWithKill) {
    return {
      code: "B",
      label: "Trust Favourite",
      rationale: `${i.favName} (${favPct}%) carries real kill power (Kill Index ${i.favKillIndex}/5) to break ${i.dogName}'s block — the first goal should open the game.`,
    };
  }

  // A — Fade Favourite: a clear favourite that struggles to break resistance.
  if (i.favKillIndex <= BLUNT_KILL || i.dogResistance >= ELITE_RESISTANCE) {
    const why =
      i.dogResistance >= ELITE_RESISTANCE
        ? `${i.dogName}'s elite low block (Resistance ${i.dogResistance}/5)`
        : `a blunt attack (Kill Index ${i.favKillIndex}/5)`;
    return {
      code: "A",
      label: "Fade Favourite",
      rationale: `${i.favName} (${favPct}%) is favoured but ${why} makes them hard to break — draw / underdog value lives here, big-cover angles are dangerous.`,
    };
  }

  // C — Favourite Wins Narrow: stronger, but the underdog stays alive.
  return {
    code: "C",
    label: "Favourite Wins Narrow",
    rationale: `${i.favName} (${favPct}%) is stronger but ${i.dogName} has real resistance — expect a one-goal margin rather than a rout.`,
  };
}
