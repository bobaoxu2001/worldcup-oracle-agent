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
 * Last updated: 2026-06-21 (later same day — 21 June results added and verified:
 * Spain 4–0 Saudi Arabia, Cape Verde 2–2 Uruguay (debutants unbeaten), Belgium
 * 0–0 Iran (10-man Belgium). Group G's Egypt v New Zealand kicks off 01:00 UTC
 * 22 June and is not reported yet. Earlier today: 20 June Groups E & F results.)
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
  // ── Structured verification provenance (all optional; display/metadata only).
  // `verified` is set only for items cross-checked against an authoritative
  // source, so the UI can show a "Verified · source" badge honestly. ──
  sourceName?: string; // e.g. "Wikipedia (Group D table)"
  sourceUrl?: string; // canonical source URL
  verified?: boolean; // true = cross-checked against an authoritative source
  verifiedAt?: string; // YYYY-MM-DD the check was performed
}

export const MANUAL_DAILY_NEWS: ManualDailyNewsItem[] = [
  // ── 21 June — matchday 2 results: Group H complete, Group G partly played ──
  {
    id: "2026-06-21-matchday2-gh",
    date: "2026-06-21",
    title: "Matchday 2: Spain hit back, Cape Verde stun again, Belgium held",
    summary:
      "Group H wrapped up its second round and Group G played one of its two games. Spain answered their shock opener with a 4–0 rout of Saudi Arabia to lead Group H, while debutants Cape Verde earned a second straight draw, 2–2 with Uruguay, to stay unbeaten and in contention. In Group G, 10-man Belgium were held to a goalless draw by Iran, who lead the group on goals scored; Egypt v New Zealand follows on 22 June.",
    tag: "Standings",
    relatedTeams: ["spain", "cape-verde", "belgium", "iran"],
    prompt: "Who will qualify from Group H?",
  },
  {
    id: "2026-06-21-esp-ksa",
    date: "2026-06-21",
    title: "Spain 4–0 Saudi Arabia — La Roja roar back",
    summary:
      "Stung by their opening 0–0 with Cape Verde, Spain were ruthless: Lamine Yamal struck early, Mikel Oyarzabal added a quickfire first-half brace and a Hassan Al-Tambakti own goal completed the rout. Spain go top of Group H on four points; Saudi Arabia, beaten heavily, are left needing a final-day win.",
    tag: "Result",
    relatedTeams: ["spain", "saudi-arabia"],
    relatedMatch: { group: "H", teamA: "spain", teamB: "saudi-arabia" },
    prompt: "How far can Spain go in the tournament?",
    sourceName: "Wikipedia (Group H table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_H",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    id: "2026-06-21-cpv-uru",
    date: "2026-06-21",
    title: "Cape Verde 2–2 Uruguay — debutants stay unbeaten",
    summary:
      "The tournament's smallest nation did it again. Kevin Pina put Cape Verde ahead before Maxi Araújo and Agustín Canobbio turned it around for Uruguay by half-time, but Hélio Varela levelled on 61' to secure a second straight draw. Cape Verde are unbeaten on two points and very much alive in Group H, with Uruguay also on two.",
    tag: "Result",
    relatedTeams: ["cape-verde", "uruguay"],
    relatedMatch: { group: "H", teamA: "cape-verde", teamB: "uruguay" },
    prompt: "Can Cape Verde qualify from Group H?",
    sourceName: "Wikipedia (Group H table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_H",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    id: "2026-06-21-bel-irn",
    date: "2026-06-21",
    title: "Belgium 0–0 Iran — Red Devils held, and down to ten",
    summary:
      "Belgium's stutter continued in a goalless draw with Iran, played out a man short after Nathan Ngoy was sent off on 66 minutes. A second straight draw leaves the favourites on just two points, level with Iran, who top Group G on goals scored. The group remains wide open with Egypt v New Zealand still to play on 22 June.",
    tag: "Result",
    relatedTeams: ["belgium", "iran"],
    relatedMatch: { group: "G", teamA: "belgium", teamB: "iran" },
    prompt: "Who will qualify from Group G?",
    sourceName: "Wikipedia (Group G table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_G",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  // ── 21 June — earlier preview (kept for the day's record) ──
  {
    id: "2026-06-21-groups-gh-preview",
    date: "2026-06-21",
    title: "Matchday 2 today: can Spain and Belgium recover from shock openers?",
    summary:
      "Groups G and H play their second round today. In Group H, Spain — held to a stunning 0–0 by debutants Cape Verde — face Saudi Arabia needing a win, while Cape Verde meet Uruguay. In Group G, a Belgium side held by Egypt take on Iran, and Egypt play New Zealand. After their opening-day draws, the favourites are under pressure to deliver.",
    tag: "Match Preview",
    relatedTeams: ["spain", "belgium", "uruguay", "iran"],
    prompt: "Who will qualify from Group H?",
  },

  // ── 20 June — matchday 2 for Groups E & F (now complete) ──
  {
    id: "2026-06-20-matchday2-ef",
    date: "2026-06-20",
    title: "Matchday 2: Germany survive a scare, Netherlands and Japan cruise",
    summary:
      "Groups E and F completed their second round. Germany came from behind to beat Ivory Coast 2–1 — Deniz Undav's stoppage-time winner clinching a knockout spot — while Ecuador and Curaçao drew 0–0. In Group F, the Netherlands routed Sweden 5–1 and Japan beat Tunisia 4–0, the two leaders level on four points and Tunisia bottom of the group on zero, their qualification hopes all but gone.",
    tag: "Standings",
    relatedTeams: ["germany", "netherlands", "japan", "ivory-coast"],
    prompt: "Who will qualify from Group F?",
  },
  {
    id: "2026-06-20-ger-civ",
    date: "2026-06-20",
    title: "Germany 2–1 Ivory Coast — Undav's late double rescues the favourites",
    summary:
      "Franck Kessié put Ivory Coast ahead on 30 minutes, but Deniz Undav levelled on 68' and snatched a stoppage-time winner (90+4') to give Germany a second straight victory. The win takes Germany top of Group E on six points and into the knockout round, while Ivory Coast stay second on three.",
    tag: "Result",
    relatedTeams: ["germany", "ivory-coast"],
    relatedMatch: { group: "E", teamA: "germany", teamB: "ivory-coast" },
    prompt: "How far can Germany go in the tournament?",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    id: "2026-06-20-ecu-cuw",
    date: "2026-06-20",
    title: "Ecuador 0–0 Curaçao — debutants hold firm for a historic point",
    summary:
      "Curaçao's compact low block frustrated Ecuador in a goalless draw in Kansas City, the tournament's smallest nation earning their first-ever World Cup point. Ecuador could not break the resistance down — echoes of Spain's stalemate with Cape Verde — and both sides are left on a single point, adrift of Germany and Ivory Coast.",
    tag: "Result",
    relatedTeams: ["ecuador", "curacao"],
    relatedMatch: { group: "E", teamA: "curacao", teamB: "ecuador" },
    prompt: "Who will qualify from Group E?",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    id: "2026-06-20-ned-swe",
    date: "2026-06-20",
    title: "Netherlands 5–1 Sweden — Oranje respond in style",
    summary:
      "Brian Brobbey and Cody Gakpo both struck twice and Crysencio Summerville added a fifth as the Netherlands bounced back from their opening draw with Japan to thrash Sweden. Anthony Elanga's strike was a brief consolation. The Dutch go top of Group F on goals scored, level with Japan on points and goal difference.",
    tag: "Result",
    relatedTeams: ["netherlands", "sweden"],
    relatedMatch: { group: "F", teamA: "netherlands", teamB: "sweden" },
    prompt: "Who will qualify from Group F?",
    sourceName: "Wikipedia (Group F table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_F",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    id: "2026-06-20-jpn-tun",
    date: "2026-06-20",
    title: "Japan 4–0 Tunisia — Samurai Blue close on the knockouts",
    summary:
      "Daichi Kamada opened inside four minutes, Ayase Ueda added a brace and Junya Itō also scored as Japan swept Tunisia aside. The win puts Japan level with the Netherlands on four points and on the brink of qualification, while a second defeat leaves Tunisia bottom on zero, needing a final-day win over the Netherlands just to keep faint hopes alive.",
    tag: "Result",
    relatedTeams: ["japan", "tunisia"],
    relatedMatch: { group: "F", teamA: "japan", teamB: "tunisia" },
    prompt: "How far can Japan go in the tournament?",
    sourceName: "Wikipedia (Group F table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_F",
    verified: true,
    verifiedAt: "2026-06-21",
  },

  // ── 19 June — matchday 2 for Groups C & D (now complete) ──
  {
    id: "2026-06-19-tur-par",
    date: "2026-06-19",
    title: "Paraguay 1–0 Türkiye — 10-man Albirroja stun the Crescent-Stars",
    summary:
      "Matías Galarza struck after 65 seconds — the fastest goal of the tournament so far — and Paraguay made it count despite Miguel Almirón's first-half red card, defending for almost an hour a man down to seal a 1–0 win in Santa Clara. Paraguay climb to three points and back into contention in Group D, while a wasteful Türkiye stay on zero and are all but eliminated.",
    tag: "Result",
    relatedTeams: ["paraguay", "turkey"],
    relatedMatch: { group: "D", teamA: "turkey", teamB: "paraguay" },
    prompt: "Who will qualify from Group D?",
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-20",
  },
  {
    id: "2026-06-19-bra-hai",
    date: "2026-06-19",
    title: "Brazil 3–0 Haiti — Seleção bounce back and go top of Group C",
    summary:
      "After being held 1–1 by Morocco, Brazil responded emphatically. Matheus Cunha struck twice (23' and 36') and Vinícius Júnior added a third in first-half stoppage time, the game effectively over by the break. Brazil move to four points and lead Group C on goal difference (+3 to Morocco's +1), with Haiti bottom of the group and on the brink of elimination.",
    tag: "Result",
    relatedTeams: ["brazil", "haiti"],
    relatedMatch: { group: "C", teamA: "brazil", teamB: "haiti" },
    prompt: "Who will qualify from Group C?",
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-20",
  },
  {
    id: "2026-06-19-matchday2-cd",
    date: "2026-06-19",
    title: "Matchday 2: Brazil hit back, Morocco edge Scotland, USA cruise, Paraguay revive",
    summary:
      "Groups C and D completed their second round. Brazil bounced back from their opening draw with a 3–0 win over Haiti to top Group C on goal difference, while Morocco beat Scotland 1–0 through an early Ismael Saibari goal to stay level on four points. In Group D, co-hosts the United States beat Australia 2–0 to reach the knockout round, and 10-man Paraguay shocked Türkiye 1–0 to reopen the race for second place.",
    tag: "Standings",
    relatedTeams: ["brazil", "morocco", "usa", "paraguay"],
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
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-20",
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
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-20",
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
