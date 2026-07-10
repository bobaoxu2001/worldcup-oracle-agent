import {
  MANUAL_MATCH_RESULTS,
  type ManualMatchResult,
} from "./manual-match-results";

/**
 * Latest verified knockout results, kept in a small append-only layer so live
 * tournament updates can be shipped without rewriting the long historical seed.
 *
 * `ALL_MATCH_RESULTS` de-duplicates by stage + unordered pairing, so once an
 * entry is later folded into manual-match-results.ts this layer cannot double
 * count it in Elo updates, the bracket, or walk-forward evaluation.
 */
export const LATEST_KNOCKOUT_RESULTS: ManualMatchResult[] = [
  {
    group: "R16",
    teamA: "usa",
    teamB: "belgium",
    scoreA: 1,
    scoreB: 4,
    date: "2026-07-06",
    note:
      "Belgium eliminated co-hosts USA 4–1 in regulation and advanced to face Spain in the quarter-finals. The result is a decisive Belgium win in the Elo fold.",
    sourceName: "The Guardian (USA 1-4 Belgium live report)",
    sourceUrl:
      "https://www.theguardian.com/football/live/2026/jul/06/usa-v-belgium-world-cup-2026-last-16-live",
    verified: true,
    verifiedAt: "2026-07-10",
  },
  {
    group: "R16",
    teamA: "argentina",
    teamB: "egypt",
    scoreA: 3,
    scoreB: 2,
    date: "2026-07-07",
    note:
      "Argentina recovered from 2–0 down late in the match to beat Egypt 3–2 in regulation and reach the quarter-finals. The result is a decisive Argentina win in the Elo fold.",
    sourceName: "Associated Press (Argentina 3-2 Egypt match report)",
    sourceUrl: "https://apnews.com/article/5129f0693b78e1ca7efeee87c46cc4cb",
    verified: true,
    verifiedAt: "2026-07-10",
  },
  {
    group: "R16",
    teamA: "switzerland",
    teamB: "colombia",
    scoreA: 0,
    scoreB: 0,
    date: "2026-07-07",
    advances: "switzerland",
    note:
      "Switzerland beat Colombia 4–3 on penalties after a 0–0 draw to reach their first World Cup quarter-final since 1954. The Elo fold records a draw; advancement is carried separately.",
    sourceName: "Reuters (Colombia exit after Switzerland shootout win)",
    sourceUrl:
      "https://www.reuters.com/sports/soccer/falcao-calls-colombian-football-a-disgrace-after-world-cup-exit-2026-07-08/",
    verified: true,
    verifiedAt: "2026-07-10",
  },
  {
    group: "QF",
    teamA: "france",
    teamB: "morocco",
    scoreA: 2,
    scoreB: 0,
    date: "2026-07-09",
    note:
      "France beat Morocco 2–0 in regulation, recording a third consecutive knockout-stage clean sheet and becoming the first confirmed semi-finalist.",
    sourceName: "Reuters (France 2-0 Morocco match report)",
    sourceUrl:
      "https://www.reuters.com/sports/soccer/mbappe-leads-france-comfortable-2-0-win-over-morocco-2026-07-09/",
    verified: true,
    verifiedAt: "2026-07-10",
  },
];

function resultKey(m: ManualMatchResult): string {
  return `${m.group}|${[m.teamA, m.teamB].sort().join("|")}`;
}

const combined: ManualMatchResult[] = [...MANUAL_MATCH_RESULTS];
const seen = new Set(combined.map(resultKey));
for (const result of LATEST_KNOCKOUT_RESULTS) {
  const key = resultKey(result);
  if (!seen.has(key)) {
    combined.push(result);
    seen.add(key);
  }
}

export const ALL_MATCH_RESULTS: ManualMatchResult[] = combined;
