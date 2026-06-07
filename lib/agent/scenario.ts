/**
 * Scenario engine — powers the agent's follow-up "what-if" re-analysis.
 *
 * Given a base matchup and a follow-up like "what if Messi was unavailable?",
 * it works out which side is affected and applies a capped, transparent Elo
 * adjustment, then the caller re-runs the model. The size of the swing scales
 * with how influential the named player is (a talisman costs more than a squad
 * player). Deterministic and honest about being an estimate.
 */

import { resolvePlayer, resolveTeams } from "./matchResolver";
import type { TeamRef } from "./types";

export interface ScenarioAdjustment {
  affectedSlug: string | null;
  eloDeltaA: number;
  eloDeltaB: number;
  label: string; // short note for the timeline
  description: string; // fuller "what changed" explanation
}

/** Star players whose absence moves the needle hardest (talisman tax, Elo). */
const TALISMAN_TAX: Record<string, number> = {
  argentina: 70, // Messi
  portugal: 55, // Ronaldo
  france: 75, // Mbappé
  norway: 90, // Haaland (carries a smaller squad)
  brazil: 50, // Vinícius / Neymar
  england: 50, // Bellingham / Kane
  spain: 45,
  croatia: 60, // Modrić
  usa: 45, // Pulisic
};

const DEFAULT_PLAYER_TAX = 40;

/**
 * Resolve a follow-up scenario into an Elo adjustment over the base matchup.
 * Returns null if no recognisable scenario is found (caller falls back to a
 * plain re-prediction).
 */
export function resolveScenario(
  query: string,
  teamA: TeamRef,
  teamB: TeamRef
): ScenarioAdjustment | null {
  const q = query.toLowerCase();
  const negated = /\b(unavailable|without|missing|injured|out|suspended|sidelined|can't play|cant play|ruled out)\b/.test(
    q
  );

  const player = resolvePlayer(query);
  if (player) {
    const target = player.slug === teamA.slug ? teamA : player.slug === teamB.slug ? teamB : null;
    if (target) {
      const tax = TALISMAN_TAX[target.slug] ?? DEFAULT_PLAYER_TAX;
      // "What if X was unavailable" hurts the team; "what if X plays/is back" helps.
      const sign = negated ? -1 : 1;
      const delta = sign * tax;
      const isA = target.slug === teamA.slug;
      return {
        affectedSlug: target.slug,
        eloDeltaA: isA ? delta : 0,
        eloDeltaB: isA ? 0 : delta,
        label: `${player.player} ${negated ? "unavailable" : "available"} → ${target.name} Elo ${delta > 0 ? "+" : ""}${delta}`,
        description: `${player.player} is a defining player for ${target.name}. The agent applies a capped ${
          delta > 0 ? "+" : ""
        }${delta} Elo adjustment to ${target.name} to reflect ${
          negated ? "their absence" : "their availability"
        }, then re-runs the full simulation. This is a transparent estimate, not a precise injury model.`,
      };
    }
  }

  // "What if {team}'s injured {role} returns?" — a positive availability swing
  // that effectively reverses an earlier injury concern. Detected even when the
  // sentence also contains "injured" (the return is what matters).
  const returning = /\b(returns?|is back|comes back|back from|recovered|fit again|available again|cleared to play)\b/.test(
    q
  );
  if (returning) {
    const named = resolveTeams(query).find(
      (t) => t.slug === teamA.slug || t.slug === teamB.slug
    );
    const target = named
      ? named.slug === teamA.slug
        ? teamA
        : teamB
      : null;
    if (target) {
      const roleMatch = q.match(
        /\b(goalkeeper|keeper|defender|fullback|full-back|centre-back|center-back|midfielder|winger|forward|striker|captain|star player|key player|player)\b/
      );
      const role = roleMatch ? roleMatch[1] : "key player";
      const delta = 45; // capped positive availability swing
      const isA = target.slug === teamA.slug;
      return {
        affectedSlug: target.slug,
        eloDeltaA: isA ? delta : 0,
        eloDeltaB: isA ? 0 : delta,
        label: `${target.name}'s ${role} returns → ${target.name} Elo +${delta}`,
        description: `The agent treats ${target.name}'s ${role} returning to fitness as a positive availability swing and applies a capped +${delta} Elo adjustment to ${target.name} before re-simulating — effectively reversing the earlier injury concern. Transparent estimate, not a precise medical model.`,
      };
    }
  }

  // Generic "home advantage" / "in form" / "tired" style scenarios.
  const formMatch = q.match(/\b(in great form|in form|on a hot streak|flying|red hot)\b/);
  if (formMatch) {
    return {
      affectedSlug: teamA.slug,
      eloDeltaA: 35,
      eloDeltaB: 0,
      label: `${teamA.name} in hot form → +35 Elo`,
      description: `The agent reads a recent-form boost for ${teamA.name} and nudges their Elo +35 before re-simulating.`,
    };
  }

  return null;
}
