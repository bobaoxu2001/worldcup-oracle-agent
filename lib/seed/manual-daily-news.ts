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
  {
    id: "2026-06-12-group-a-standings",
    date: "2026-06-12",
    title: "Group A after Matchday 1: Mexico top, everything still open",
    summary:
      "Mexico lead Group A on 3 points after the opening win; South Korea and Czech Republic share a point each, South Africa bottom on 0. Two rounds left — every team can still qualify.",
    tag: "Standings",
    relatedTeams: ["mexico", "south-korea", "czech-republic", "south-africa"],
    prompt: "Who will qualify from Group A?",
  },
  {
    id: "2026-06-12-kor-cze-draw",
    date: "2026-06-12",
    title: "South Korea and Czech Republic split the points in a 1–1 draw",
    summary:
      "A cagey Group A opener ends level — both sides stay within reach of Mexico ahead of Matchday 2.",
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
