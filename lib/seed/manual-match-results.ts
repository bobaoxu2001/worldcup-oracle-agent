/**
 * Manually entered match results — the EDITABLE results layer.
 *
 * Edit this file to record group-stage results by hand. The current entries are
 * the REAL World Cup 2026 group-stage outcomes as they are played (sourced from
 * public match reports), entered through this labelled manual layer. They feed
 * the Group Standings on /schedule, the score shown next to each drawn pairing,
 * and the post-match Elo updates — but a verified cached live result for the same
 * pairing always takes precedence (see the transparency rules below).
 *
 * Transparency rules (enforced in lib/schedule/buildSchedule.ts):
 *   • A verified live result from the football-data.org cache ALWAYS wins
 *     over a manual entry for the same pairing.
 *   • Manual results are labelled "manual" wherever they appear — they are
 *     never presented as live data.
 *
 * Team fields are canonical slugs from lib/seed/world-cup-2026-groups.ts.
 * Last updated: 2026-06-14 (all finished matches through 13 June).
 */

export interface ManualMatchResult {
  group: string; // "A" .. "L"
  teamA: string; // slug
  teamB: string; // slug
  scoreA: number;
  scoreB: number;
  date?: string; // YYYY-MM-DD (optional, display only)
  note?: string;
}

export const MANUAL_MATCH_RESULTS: ManualMatchResult[] = [
  // 11 June — Group A opens the tournament
  {
    group: "A",
    teamA: "mexico",
    teamB: "south-africa",
    scoreA: 2,
    scoreB: 0,
    date: "2026-06-11",
    note: "Tournament opener",
  },
  {
    group: "A",
    teamA: "south-korea",
    teamB: "czech-republic",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-11",
    note: "South Korea came from behind",
  },
  // 12 June
  {
    group: "B",
    teamA: "canada",
    teamB: "bosnia-and-herzegovina",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-12",
  },
  {
    group: "D",
    teamA: "usa",
    teamB: "paraguay",
    scoreA: 4,
    scoreB: 1,
    date: "2026-06-12",
  },
  // 13 June
  {
    group: "B",
    teamA: "qatar",
    teamB: "switzerland",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-13",
  },
  {
    group: "C",
    teamA: "brazil",
    teamB: "morocco",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-13",
  },
  {
    group: "C",
    teamA: "scotland",
    teamB: "haiti",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-13",
  },
  {
    group: "D",
    teamA: "australia",
    teamB: "turkey",
    scoreA: 2,
    scoreB: 0,
    date: "2026-06-13",
  },
];
