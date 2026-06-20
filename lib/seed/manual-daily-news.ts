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
 * Last updated: 2026-06-20 (matchday-2 results through the confirmed 19 June
 * Group C & D games; the later Brazil–Haiti and Türkiye–Paraguay kickoffs were
 * still in progress and are not yet reported).
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
  // ── 19 June — matchday 2 begins for Groups C & D ──
  {
    id: "2026-06-19-matchday2-cd",
    date: "2026-06-19",
    title: "Matchday 2: Morocco edge Scotland, USA cruise past Australia",
    summary:
      "The second round of group games reached Groups C and D. Morocco beat Scotland 1–0 — an early Ismael Saibari goal enough to send them top of Group C on four points. In Group D, co-hosts the United States beat Australia 2–0 (a Burgess own goal and an Alex Freeman strike) to make it two wins from two and reach the knockout round. Brazil v Haiti and Türkiye v Paraguay kicked off later.",
    tag: "Standings",
    relatedTeams: ["morocco", "scotland", "usa", "australia"],
    prompt: "Who will qualify from Group D?",
  },
  {
    id: "2026-06-19-sco-mar",
    date: "2026-06-19",
    title: "Morocco 1–0 Scotland",
    summary:
      "Saibari struck inside the opening two minutes and Morocco's compact, transition-sharp side protected the lead to go top of Group C. Scotland, beaten for the first time, will need a result in their final game.",
    tag: "Result",
    relatedTeams: ["morocco", "scotland"],
    relatedMatch: { group: "C", teamA: "scotland", teamB: "morocco" },
    prompt: "Who will qualify from Group C?",
  },
  {
    id: "2026-06-19-usa-aus",
    date: "2026-06-19",
    title: "USA 2–0 Australia — co-hosts into the knockouts",
    summary:
      "A first-half own goal and a Freeman finish gave the United States a comfortable win and a perfect six points from two games, clinching a place in the round of 32 with a match to spare.",
    tag: "Result",
    relatedTeams: ["usa", "australia"],
    relatedMatch: { group: "D", teamA: "usa", teamB: "australia" },
    prompt: "How far can the USA go in the tournament?",
  },

  // ── 15 June — Groups G & H open (previews; not yet played) ──
  {
    id: "2026-06-15-daily-brief",
    date: "2026-06-15",
    title: "Groups G and H complete the opening round",
    summary:
      "The last eight nations begin today. In Group G, Belgium face New Zealand and Egypt meet Iran; in Group H, Spain take on Cape Verde and Uruguay play Saudi Arabia. After today every one of the 48 teams will have played once.",
    tag: "Match Preview",
    relatedTeams: ["belgium", "spain", "uruguay", "iran"],
    prompt: "Who will qualify from Group H?",
  },

  // ── 14 June — Groups E & F open their campaigns ──
  {
    id: "2026-06-14-groups-ef-done",
    date: "2026-06-14",
    title: "Groups E & F open: Germany thrash Curaçao, Japan hold the Netherlands",
    summary:
      "Germany made a statement with a 7–1 rout of Curaçao, while Sweden put five past Tunisia. In Group F, Japan twice came from behind to earn a 2–2 draw with the Netherlands, and Ivory Coast edged Ecuador 1–0.",
    tag: "Standings",
    relatedTeams: ["germany", "netherlands", "japan", "sweden"],
    prompt: "Did Japan's draw with the Netherlands change Group F?",
  },
  {
    id: "2026-06-14-injury-watch",
    date: "2026-06-14",
    title: "Injury watch: Japan missing Mitoma & Endo; Germany without Karl",
    summary:
      "Japan opened without three notable names — winger Kaoru Mitoma (hamstring, left out of the squad), captain Wataru Endo (foot injury, withdrew and retired from the national team) and Takumi Minamino (long-term ACL). Germany are without Lennart Karl (torn muscle), with Kai Havertz reported to miss the early fixtures. The Oracle has trimmed Japan's squad-availability Elo and applied a small reduction to Germany.",
    tag: "Injury",
    relatedTeams: ["japan", "germany"],
    prompt: "How do the injuries affect Japan's chances?",
  },
  {
    id: "2026-06-14-ger-cuw",
    date: "2026-06-14",
    title: "Germany 7–1 Curaçao",
    summary:
      "Germany open Group E in emphatic style, hitting seven past tournament debutants Curaçao at a sold-out stadium.",
    tag: "Result",
    relatedTeams: ["germany", "curacao"],
    relatedMatch: { group: "E", teamA: "germany", teamB: "curacao" },
    prompt: "How far can Germany go in the tournament?",
  },
  {
    id: "2026-06-14-ned-jpn",
    date: "2026-06-14",
    title: "Netherlands 2–2 Japan",
    summary:
      "Japan twice hit back — through Nakamura and a late Kamada strike — to share the points with the Netherlands in a thrilling Group F opener.",
    tag: "Result",
    relatedTeams: ["netherlands", "japan"],
    relatedMatch: { group: "F", teamA: "netherlands", teamB: "japan" },
    prompt: "Compare Netherlands and Japan",
  },
  {
    id: "2026-06-14-swe-tun",
    date: "2026-06-14",
    title: "Sweden 5–1 Tunisia",
    summary:
      "Sweden make a flying start in Group F, with Isak and Gyökeres among the scorers in a 5–1 win over Tunisia.",
    tag: "Result",
    relatedTeams: ["sweden", "tunisia"],
    relatedMatch: { group: "F", teamA: "sweden", teamB: "tunisia" },
    prompt: "Who will qualify from Group F?",
  },
  {
    id: "2026-06-14-civ-ecu",
    date: "2026-06-14",
    title: "Ivory Coast 1–0 Ecuador",
    summary:
      "Ivory Coast take all three points in Group E with a narrow 1–0 win over Ecuador.",
    tag: "Result",
    relatedTeams: ["ivory-coast", "ecuador"],
    relatedMatch: { group: "E", teamA: "ivory-coast", teamB: "ecuador" },
    prompt: "Who will qualify from Group E?",
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
