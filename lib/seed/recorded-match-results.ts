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
  {
    group: "QF",
    teamA: "spain",
    teamB: "belgium",
    scoreA: 2,
    scoreB: 1,
    date: "2026-07-10",
    note:
      "Spain beat Belgium 2–1 in regulation — Fabián Ruiz's opener was cancelled out by Charles De Ketelaere before Mikel Merino headed a late winner (88') — to reach a semi-final against France. A decisive Spain win in the Elo fold.",
    sourceName: "ESPN match report (cross-checked vs FIFA match centre + CNN)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760511/belgium-spain",
    verified: true,
    verifiedAt: "2026-07-13",
  },
  {
    group: "QF",
    teamA: "norway",
    teamB: "england",
    scoreA: 1,
    scoreB: 2,
    date: "2026-07-11",
    note:
      "England beat Norway 2–1 after extra time: Andreas Schjelderup put Norway ahead, Jude Bellingham levelled before the break, and after a 1–1 regulation Bellingham struck again early in extra time to complete his brace. Recorded at the extra-time score — a decisive England win in the Elo fold, no shootout. England advance to face Argentina.",
    sourceName: "ESPN match report (cross-checked vs NPR + englandfootball.com)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760512/england-norway",
    verified: true,
    verifiedAt: "2026-07-13",
  },
  {
    group: "QF",
    teamA: "argentina",
    teamB: "switzerland",
    scoreA: 3,
    scoreB: 1,
    date: "2026-07-11",
    note:
      "Holders Argentina beat ten-man Switzerland 3–1 after extra time: Alexis Mac Allister headed in a Messi cross (10'), Dan Ndoye levelled (67'), and after Breel Embolo's 72' second yellow, Julián Álvarez (112') and Lautaro Martínez (120+1') struck in extra time. Recorded at the extra-time score — a decisive Argentina win in the Elo fold. Argentina reach the semi-finals.",
    sourceName: "ESPN match report (cross-checked vs FIFA match centre + Al Jazeera)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760513/switzerland-argentina",
    verified: true,
    verifiedAt: "2026-07-13",
  },
  {
    group: "SF",
    teamA: "france",
    teamB: "spain",
    scoreA: 0,
    scoreB: 2,
    date: "2026-07-14",
    note:
      "Spain beat France 2–0 in regulation to reach the World Cup final — Mikel Oyarzabal converted a first-half penalty (22') and Pedro Porro doubled the lead (58'). A decisive Spain win in the Elo fold; Spain await the winner of Argentina v England (15 Jul). The other semi-final was unplayed at the time of writing, so it is not recorded here.",
    sourceName: "ESPN match report (cross-checked vs FIFA match centre + Al Jazeera + NBC)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760514/spain-france",
    verified: true,
    verifiedAt: "2026-07-15",
  },
  {
    group: "SF",
    teamA: "argentina",
    teamB: "england",
    scoreA: 2,
    scoreB: 1,
    date: "2026-07-15",
    note:
      "Holders Argentina came from behind to beat England 2–1 in regulation and set up a final against Spain. Anthony Gordon put England ahead (55') before Argentina struck twice late — Enzo Fernández equalised (85') and Lautaro Martínez won it deep in stoppage time (90'+2'), with Lionel Messi the creator for the comeback. A decisive Argentina win in the Elo fold; no shootout.",
    sourceName: "ESPN match report (cross-checked vs FIFA match centre + NPR + NBC)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760515/argentina-england",
    verified: true,
    verifiedAt: "2026-07-16",
  },
  {
    group: "3P",
    teamA: "france",
    teamB: "england",
    scoreA: 4,
    scoreB: 6,
    date: "2026-07-18",
    note:
      "England beat France 6–4 in regulation in the bronze final to finish third. England led 4–0 at half-time, France mounted a second-half comeback, and late goals from Bukayo Saka and Jude Bellingham secured a decisive England win in the Elo fold.",
    sourceName: "FIFA (France 4-6 England bronze-final report and highlights)",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/france-england-report-highlights-bronze-final",
    verified: true,
    verifiedAt: "2026-07-20",
  },
  {
    group: "F",
    teamA: "spain",
    teamB: "argentina",
    scoreA: 1,
    scoreB: 0,
    date: "2026-07-19",
    note:
      "Spain beat ten-man Argentina 1–0 after extra time to win their second World Cup. Ferran Torres scored in the 106th minute after Enzo Fernández was dismissed in second-half stoppage time. Recorded at the extra-time score — a decisive Spain win in the Elo fold, no shootout.",
    sourceName: "Reuters (Spain 1-0 Argentina World Cup final report)",
    sourceUrl:
      "https://www.reuters.com/sports/soccer/torres-grabs-extra-time-winner-spain-beat-toothless-argentina-win-their-second-2026-07-19/",
    verified: true,
    verifiedAt: "2026-07-20",
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