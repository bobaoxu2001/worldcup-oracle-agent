/**
 * Manual Daily Brief — the EDITABLE daily narrative layer.
 *
 * This file is the single place to control "today's story" on the site
 * (shown on /news above the live GNews browser). It complements — never
 * replaces — the live news layer, and is always labelled as manually
 * curated so it can't be mistaken for a live feed.
 *
 * To update the site for a new day: add items at the TOP of the array
 * with today's date (YYYY-MM-DD) and redeploy. Newest date renders first.
 *
 * `relatedTeams` uses canonical team slugs from
 * lib/seed/world-cup-2026-groups.ts so flags/names resolve consistently.
 * `prompt` (optional) renders an "Ask the Oracle" chip that opens the
 * Agent page with that question pre-submitted.
 *
 * Last updated: 2026-06-14 (results through 13 June; 14 June fixtures previewed).
 */

export type ManualDailyNewsTag =
  | "Result"
  | "Standings"
  | "Match Preview"
  | "Team News"
  | "Injury"
  | "Prediction"
  | "Tournament";

export interface ManualDailyNewsItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  tag: ManualDailyNewsTag;
  /** Canonical team slugs (see world-cup-2026-groups.ts). */
  relatedTeams?: string[];
  relatedMatch?: {
    group?: string;
    teamA: string; // slug
    teamB: string; // slug
  };
  /** Example question for the Agent — renders an "Ask the Oracle" chip. */
  prompt?: string;
}

export const MANUAL_DAILY_NEWS: ManualDailyNewsItem[] = [
  // ── 14 June — Groups E & F open (previews; not yet played) ──
  {
    id: "2026-06-14-daily-brief",
    date: "2026-06-14",
    title: "Groups E and F kick off: Germany and the Netherlands begin",
    summary:
      "Eight more nations start their tournament today. In Group E, Germany face Curaçao and Ivory Coast meet Ecuador; in Group F, the Netherlands take on Japan and Sweden play Tunisia.",
    tag: "Match Preview",
    relatedTeams: ["germany", "netherlands", "japan", "sweden"],
    prompt: "Who will qualify from Group F?",
  },

  // ── 13 June — Groups B, C, D complete their opening round ──
  {
    id: "2026-06-13-opening-round-done",
    date: "2026-06-13",
    title: "Opening fixtures wrap up across Groups A–D",
    summary:
      "Holders' rivals Brazil were held 1–1 by Morocco and Qatar drew 1–1 with Switzerland, while Scotland edged Haiti 1–0 and Australia beat Türkiye 2–0. Every team in Groups A–D has now played once.",
    tag: "Standings",
    relatedTeams: ["brazil", "morocco", "australia", "scotland"],
    prompt: "Did the opening results change the title picture?",
  },
  {
    id: "2026-06-13-aus-tur",
    date: "2026-06-13",
    title: "Australia stun Türkiye 2–0 in Vancouver",
    summary:
      "Australia open Group D with an impressive 2–0 win over Türkiye at BC Place, drawing level with the USA on three points.",
    tag: "Result",
    relatedTeams: ["australia", "turkey"],
    relatedMatch: { group: "D", teamA: "australia", teamB: "turkey" },
    prompt: "Compare Australia and Türkiye",
  },
  {
    id: "2026-06-13-bra-mar",
    date: "2026-06-13",
    title: "Brazil held to a 1–1 draw by Morocco",
    summary:
      "One of the pre-tournament favourites drop points in their opener as Morocco earn a 1–1 draw at MetLife Stadium in Group C.",
    tag: "Result",
    relatedTeams: ["brazil", "morocco"],
    relatedMatch: { group: "C", teamA: "brazil", teamB: "morocco" },
    prompt: "How much did the draw hurt Brazil's chances to win Group C?",
  },
  {
    id: "2026-06-13-sco-hai",
    date: "2026-06-13",
    title: "Scotland beat Haiti 1–0",
    summary:
      "Scotland take all three points in their Group C opener with a narrow 1–0 win over Haiti at Gillette Stadium.",
    tag: "Result",
    relatedTeams: ["scotland", "haiti"],
    relatedMatch: { group: "C", teamA: "scotland", teamB: "haiti" },
    prompt: "Who will qualify from Group C?",
  },
  {
    id: "2026-06-13-qat-sui",
    date: "2026-06-13",
    title: "Qatar and Switzerland share the points, 1–1",
    summary:
      "Switzerland are held 1–1 by Qatar in Group B, leaving the group wide open after both opening fixtures finished level.",
    tag: "Result",
    relatedTeams: ["qatar", "switzerland"],
    relatedMatch: { group: "B", teamA: "qatar", teamB: "switzerland" },
    prompt: "Who will qualify from Group B?",
  },

  // ── 12 June ──
  {
    id: "2026-06-12-usa-par",
    date: "2026-06-12",
    title: "USA thrash Paraguay 4–1 in their opener",
    summary:
      "Co-hosts the United States make a statement with a 4–1 win over Paraguay at SoFi Stadium, going top of Group D after Matchday 1.",
    tag: "Result",
    relatedTeams: ["usa", "paraguay"],
    relatedMatch: { group: "D", teamA: "usa", teamB: "paraguay" },
    prompt: "How does the opening win change the USA's chances to win Group D?",
  },
  {
    id: "2026-06-12-can-bih",
    date: "2026-06-12",
    title: "Canada held 1–1 by Bosnia & Herzegovina",
    summary:
      "Co-hosts Canada are pegged back to a 1–1 draw by Bosnia & Herzegovina at BMO Field in their Group B opener.",
    tag: "Result",
    relatedTeams: ["canada", "bosnia-and-herzegovina"],
    relatedMatch: { group: "B", teamA: "canada", teamB: "bosnia-and-herzegovina" },
    prompt: "Compare Canada and Bosnia & Herzegovina",
  },

  // ── 11 June — Group A opens the tournament ──
  {
    id: "2026-06-11-group-a-standings",
    date: "2026-06-11",
    title: "Group A after Matchday 1: Mexico and South Korea lead",
    summary:
      "Mexico and South Korea lead Group A on 3 points each after winning their openers; Czech Republic and South Africa are bottom on 0. Two rounds left — every team can still qualify.",
    tag: "Standings",
    relatedTeams: ["mexico", "south-korea", "czech-republic", "south-africa"],
    prompt: "Who will qualify from Group A?",
  },
  {
    id: "2026-06-11-kor-cze",
    date: "2026-06-11",
    title: "South Korea come from behind to beat Czech Republic 2–1",
    summary:
      "Trailing to a Krejčí goal, South Korea hit back through Hwang In-beom and Oh Hyeon-gyu to take all three points in their Group A opener, joining Mexico at the top.",
    tag: "Result",
    relatedTeams: ["south-korea", "czech-republic"],
    relatedMatch: { group: "A", teamA: "south-korea", teamB: "czech-republic" },
    prompt: "Compare South Korea and Czech Republic",
  },
  {
    id: "2026-06-11-mex-rsa-opener",
    date: "2026-06-11",
    title: "Mexico open Group A with a 2–0 win over South Africa",
    summary:
      "The hosts take maximum points from the tournament opener. Three points and a clean sheet put Mexico in the driving seat in Group A.",
    tag: "Result",
    relatedTeams: ["mexico", "south-africa"],
    relatedMatch: { group: "A", teamA: "mexico", teamB: "south-africa" },
    prompt: "How does the opening win change Mexico's chances to win Group A?",
  },
  {
    id: "2026-06-11-title-race",
    date: "2026-06-11",
    title: "Opening day: who are the Oracle's title contenders?",
    summary:
      "The tournament is under way. The model's pre-tournament favourites — Spain, Argentina, France, England and Brazil — now start proving it on the pitch.",
    tag: "Prediction",
    prompt: "Who will win the World Cup?",
  },
];

/** Brief items sorted newest-date first (stable within a date by array order). */
export function getManualDailyNews(limit?: number): ManualDailyNewsItem[] {
  const sorted = [...MANUAL_DAILY_NEWS].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}
