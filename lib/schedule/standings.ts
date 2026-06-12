/**
 * Group standings computed PURELY from known results on the merged group
 * fixtures (verified live cache results + manually entered results — see
 * mergeLiveIntoGroups / mergeManualIntoGroups in buildSchedule.ts).
 *
 * Nothing is simulated or invented here: a match only counts when it is
 * Finished with structured goals. Tiebreakers follow the standard FIFA
 * group ordering we can compute from results alone: points → goal
 * difference → goals scored → name (stable display order).
 */

import { getTeam } from "@/lib/seed/world-cup-2026-groups";
import type { GroupFixtures } from "./buildSchedule";

export interface StandingRow {
  slug: string;
  name: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface GroupStanding {
  group: string;
  rows: StandingRow[];
  /** How many counted results came from each source (for honest labelling). */
  liveResults: number;
  manualResults: number;
}

function blankRow(slug: string): StandingRow {
  const t = getTeam(slug);
  return {
    slug,
    name: t.name,
    flag: t.flag,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

/** Standings for every group; groups without results have all-zero rows. */
export function computeStandings(groups: GroupFixtures[]): GroupStanding[] {
  return groups.map((g) => {
    const table = new Map<string, StandingRow>();
    let liveResults = 0;
    let manualResults = 0;

    for (const r of g.rows) {
      if (r.slugA && !table.has(r.slugA)) table.set(r.slugA, blankRow(r.slugA));
      if (r.slugB && !table.has(r.slugB)) table.set(r.slugB, blankRow(r.slugB));

      const counted =
        r.status === "Finished" &&
        typeof r.goalsA === "number" &&
        typeof r.goalsB === "number" &&
        r.slugA &&
        r.slugB;
      if (!counted) continue;

      if (r.resultSource === "manual") manualResults++;
      else liveResults++;

      const a = table.get(r.slugA!)!;
      const b = table.get(r.slugB!)!;
      const ga = r.goalsA!;
      const gb = r.goalsB!;
      a.played++;
      b.played++;
      a.goalsFor += ga;
      a.goalsAgainst += gb;
      b.goalsFor += gb;
      b.goalsAgainst += ga;
      if (ga > gb) {
        a.won++;
        b.lost++;
        a.points += 3;
      } else if (ga < gb) {
        b.won++;
        a.lost++;
        b.points += 3;
      } else {
        a.drawn++;
        b.drawn++;
        a.points++;
        b.points++;
      }
    }

    const rows = [...table.values()].map((r) => ({
      ...r,
      goalDiff: r.goalsFor - r.goalsAgainst,
    }));
    rows.sort(
      (x, y) =>
        y.points - x.points ||
        y.goalDiff - x.goalDiff ||
        y.goalsFor - x.goalsFor ||
        x.name.localeCompare(y.name)
    );
    return { group: g.group, rows, liveResults, manualResults };
  });
}

/** Only the groups that already have at least one counted result. */
export function standingsWithResults(groups: GroupFixtures[]): GroupStanding[] {
  return computeStandings(groups).filter((s) => s.liveResults + s.manualResults > 0);
}
