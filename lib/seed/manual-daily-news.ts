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
 * Last updated: 2026-06-27 — the group stage is COMPLETE. Groups G–L finished on
 * 26–27 June: Egypt won Group G on goals scored over Belgium; debutants Cape Verde
 * went through from Group H as Uruguay crashed out; France took Group I with a
 * perfect record; Argentina won Group J and Austria took second; Portugal pipped
 * Colombia to top Group K; and England won Group L with Ghana qualifying second on
 * a disciplined draw. These G–L items are curated on the day of the games and are
 * NOT badged "verified" (not yet cross-checked against an authoritative table); the
 * A–F items remain verified. All 24 round-of-32 qualifiers' group placings are now
 * set; the eight best third-placed teams resolve from the standings.
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
  // ── 27 June — matchday 3 results: Groups J, K & L complete the group stage ──
  {
    id: "2026-06-27-matchday3-jkl",
    date: "2026-06-27",
    title: "Group stage done: Portugal pip Colombia, Ghana hold on, Argentina finish perfect",
    summary:
      "The final groups settled the last knockout places. Argentina rotated and still beat Jordan 2–0 to win Group J with nine points, Austria taking second past Algeria with a 2–1 win. Portugal beat Colombia 2–1 to snatch top spot in Group K — both already through — while DR Congo's 2–0 win over Uzbekistan put them third. In Group L, England beat Panama 3–0 to finish top and Ghana's disciplined 1–1 draw with Croatia carried them into the round of 32 as runners-up. With all 12 groups complete, the 16 group winners and runners-up are joined by the eight best third-placed teams.",
    tag: "Standings",
    relatedTeams: ["portugal", "england", "ghana", "argentina"],
    prompt: "Which eight third-placed teams qualify for the round of 32?",
  },
  {
    id: "2026-06-27-por-col",
    date: "2026-06-27",
    title: "Portugal 2–1 Colombia — Ronaldo's side snatch Group K",
    summary:
      "Portugal beat an already-qualified Colombia 2–1 to leapfrog them and win Group K on seven points, Cristiano Ronaldo again at the heart of it after his slow start to the tournament. Colombia go through second; DR Congo finish third and into the best-thirds pool.",
    tag: "Result",
    relatedTeams: ["portugal", "colombia"],
    relatedMatch: { group: "K", teamA: "portugal", teamB: "colombia" },
    prompt: "How far can Portugal go in the knockouts?",
  },
  {
    id: "2026-06-27-cro-gha",
    date: "2026-06-27",
    title: "Croatia 1–1 Ghana — Ghana's resistance books a knockout place",
    summary:
      "A 1–1 draw was exactly what Ghana needed: it sent them through as Group L runners-up on five points, the organised low block the model re-scored after their goalless draw with England holding firm once more. Croatia finish third on four points and keep a live best-thirds case.",
    tag: "Result",
    relatedTeams: ["croatia", "ghana"],
    relatedMatch: { group: "L", teamA: "croatia", teamB: "ghana" },
    prompt: "Can Ghana spring a surprise in the round of 32?",
  },

  // ── 26 June — matchday 3 results: Groups G, H & I complete ──
  {
    id: "2026-06-26-matchday3-ghi",
    date: "2026-06-26",
    title: "Cape Verde make history; Egypt edge Belgium; France finish perfect",
    summary:
      "Groups G, H and I delivered the final round's biggest story: debutants Cape Verde beat Saudi Arabia 1–0 to reach the round of 32, unbeaten, while Uruguay lost 2–1 to Spain and went out in third. Egypt's 1–1 draw with Iran won them Group G on goals scored over Belgium (both on five points and the same goal difference), with Belgium second after a 2–0 win over New Zealand. France beat Norway 2–1 to take Group I with a perfect nine points, Norway qualifying second.",
    tag: "Standings",
    relatedTeams: ["cape-verde", "egypt", "spain", "france"],
    prompt: "How did Cape Verde reach the knockouts on their World Cup debut?",
  },
  {
    id: "2026-06-26-cpv-ksa",
    date: "2026-06-26",
    title: "Cape Verde 1–0 Saudi Arabia — debutants into the last 32",
    summary:
      "Cape Verde's first-ever World Cup win sent them through as Group H runners-up on five points, unbeaten across the group after holding both Spain and Uruguay. The compact, well-drilled low block the model profiled after the 0–0 with Spain carried the islanders all the way to the round of 32. Spain won the group; Saudi Arabia finished bottom and are out.",
    tag: "Result",
    relatedTeams: ["cape-verde", "saudi-arabia"],
    relatedMatch: { group: "H", teamA: "cape-verde", teamB: "saudi-arabia" },
    prompt: "Who could Cape Verde face in the round of 32?",
  },
  {
    id: "2026-06-26-egy-irn",
    date: "2026-06-26",
    title: "Egypt 1–1 Iran — Egypt top Group G on goals scored",
    summary:
      "A 1–1 draw was enough for Egypt to win Group G: level with Belgium on five points and the same +2 goal difference, the Pharaohs edged top spot on goals scored (five to three). It is a landmark group win after Egypt's first-ever World Cup victory in the previous round. Iran drew all three to finish third and enter the best-thirds pool.",
    tag: "Result",
    relatedTeams: ["egypt", "iran"],
    relatedMatch: { group: "G", teamA: "egypt", teamB: "iran" },
    prompt: "How far can Egypt go from here?",
  },

  // ── 25 June — matchday 3 results: Groups D, E & F complete ──
  {
    id: "2026-06-25-matchday3-def",
    date: "2026-06-25",
    title: "Matchday 3: USA top Group D despite defeat; Germany survive Ecuador scare; Netherlands cruise",
    summary:
      "Groups D, E and F finished the final round. The hosts United States lost 3–2 to Türkiye — Kaan Ayhan scoring in the eighth minute of stoppage time — but still won Group D, with Australia edging Paraguay for second on goal difference. Germany were beaten 2–1 by Ecuador yet topped Group E on goal difference, Ivory Coast taking second. The Netherlands beat Tunisia 3–1 to win Group F, Japan qualifying second after a 1–1 draw with Sweden. Ecuador, Paraguay and Sweden all finish third and go into the best-thirds pool.",
    tag: "Standings",
    relatedTeams: ["usa", "germany", "netherlands", "ecuador"],
    prompt: "Which third-placed teams will reach the round of 32?",
  },
  {
    id: "2026-06-25-ecu-ger",
    date: "2026-06-25",
    title: "Ecuador 2–1 Germany — Germany lose but win the group",
    summary:
      "Nilson Angulo and Gonzalo Plata struck either side of half-time to overturn Leroy Sané's second-minute opener and hand Germany a surprise 2–1 defeat. Germany still finished top of Group E on goal difference ahead of Ivory Coast, while Ecuador's three points lifted them to third and into the best-thirds race.",
    tag: "Result",
    relatedTeams: ["ecuador", "germany"],
    relatedMatch: { group: "E", teamA: "ecuador", teamB: "germany" },
    prompt: "How far can Germany go in the knockouts?",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    id: "2026-06-25-tur-usa",
    date: "2026-06-25",
    title: "Türkiye 3–2 USA — hosts lose the battle, win the group",
    summary:
      "Türkiye took a thrilling final-round contest 3–2, Kaan Ayhan finishing it deep into stoppage time, but the United States had already done enough to top Group D. Australia claimed the runners-up spot on goal difference over Paraguay, while Türkiye were eliminated despite the win.",
    tag: "Result",
    relatedTeams: ["turkey", "usa"],
    relatedMatch: { group: "D", teamA: "turkey", teamB: "usa" },
    prompt: "Who will the USA face in the round of 32?",
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-26",
  },

  // ── 24 June — matchday 3 results: Groups A, B & C complete ──
  {
    id: "2026-06-24-matchday3-abc",
    date: "2026-06-24",
    title: "Matchday 3: Mexico finish perfect; Brazil and Morocco both through",
    summary:
      "The final round opened with Groups A, B and C. Hosts Mexico beat Czechia 3–0 to complete a flawless group stage — three wins, six goals, none conceded — with South Africa joining them in second. Switzerland edged Canada 2–1 to win Group B, Canada qualifying second and Bosnia going through as a best-third candidate. In Group C, Brazil beat Scotland 3–0 (Vinícius Júnior with a brace) to pip Morocco to top spot on goal difference, with Morocco safely second after a 4–2 win over Haiti.",
    tag: "Standings",
    relatedTeams: ["mexico", "brazil", "morocco", "switzerland"],
    prompt: "Who tops the best-thirds standings so far?",
  },
  {
    id: "2026-06-24-sco-bra",
    date: "2026-06-24",
    title: "Scotland 0–3 Brazil — Vinícius double sends Brazil top",
    summary:
      "Vinícius Júnior scored twice and Matheus Cunha added a third as Brazil beat Scotland 3–0 to win Group C, edging Morocco on goal difference with both level on seven points. Scotland finish third and must wait on the best-thirds permutations.",
    tag: "Result",
    relatedTeams: ["scotland", "brazil"],
    relatedMatch: { group: "C", teamA: "scotland", teamB: "brazil" },
    prompt: "How far can Brazil go at this World Cup?",
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    id: "2026-06-24-cze-mex",
    date: "2026-06-24",
    title: "Mexico 3–0 Czechia — hosts complete a perfect group stage",
    summary:
      "Goals from Mateo Chávez, Julián Quiñones and a stoppage-time Álvaro Fidalgo finish gave Mexico a 3–0 win to end the group stage with a perfect record: three wins, six scored, none conceded, and nine points at the top of Group A. South Africa qualified second; Czechia finished bottom and are out.",
    tag: "Result",
    relatedTeams: ["mexico", "czech-republic"],
    relatedMatch: { group: "A", teamA: "czech-republic", teamB: "mexico" },
    prompt: "Can Mexico make a deep run as hosts?",
    sourceName: "Wikipedia (Group A table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_A",
    verified: true,
    verifiedAt: "2026-06-26",
  },

  // ── 23 June — matchday 2 results: Groups K & L complete the second round ──
  {
    id: "2026-06-23-matchday2-kl",
    date: "2026-06-23",
    title: "Matchday 2 complete: Ronaldo makes history, Colombia through, Panama on the brink",
    summary:
      "Groups K and L finished the second round, which is now complete across all 12 groups. Cristiano Ronaldo scored twice in Portugal's 5–0 rout of Uzbekistan to become the first player to score at six different World Cups, while Colombia beat DR Congo 1–0 to reach the knockouts. In Group L, England were held to a goalless draw by Ghana — leaving both on four points — and Croatia beat Panama 1–0 to leave the Central Americans bottom on zero and all but out (they can no longer finish in the top two, with only a faint best-third route left).",
    tag: "Standings",
    relatedTeams: ["portugal", "colombia", "england", "panama"],
    prompt: "Who will qualify from Group L?",
  },
  {
    id: "2026-06-23-por-uzb",
    date: "2026-06-23",
    title: "Portugal 5–0 Uzbekistan — Ronaldo's record sixth-World-Cup goals",
    summary:
      "Cristiano Ronaldo struck twice to become the first player ever to score at six different World Cups, with Nuno Mendes, an own goal and Rafael Leão completing a 5–0 rout of debutants Uzbekistan. The brace — Ronaldo's first goals of the tournament — answered the criticism after Portugal's opening draw and lifted them to second in Group K, well placed to join Colombia in the knockouts.",
    tag: "Result",
    relatedTeams: ["portugal", "uzbekistan"],
    relatedMatch: { group: "K", teamA: "portugal", teamB: "uzbekistan" },
    prompt: "How far can Portugal go in the tournament?",
    sourceName: "Wikipedia (Group K table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-23-col-cod",
    date: "2026-06-23",
    title: "Colombia 1–0 DR Congo — Muñoz sends Colombia through",
    summary:
      "Daniel Muñoz's deflected second-half strike was enough to break down a stubborn DR Congo and give Colombia a second straight win. The result takes Colombia top of Group K on six points and into the round of 32 with a game to spare, while DR Congo slip to third.",
    tag: "Result",
    relatedTeams: ["colombia", "dr-congo"],
    relatedMatch: { group: "K", teamA: "dr-congo", teamB: "colombia" },
    prompt: "Who will qualify from Group K?",
    sourceName: "Wikipedia (Group K table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-23-eng-gha",
    date: "2026-06-23",
    title: "England 0–0 Ghana — Three Lions held despite dominance",
    summary:
      "England controlled the game and piled up 19 shots to Ghana's two but couldn't find a way through in a goalless draw at Gillette Stadium. The point leaves England top of Group L on goal difference, level on four points with Ghana, with both sides still to seal their places.",
    tag: "Result",
    relatedTeams: ["england", "ghana"],
    relatedMatch: { group: "L", teamA: "england", teamB: "ghana" },
    prompt: "Who will qualify from Group L?",
    sourceName: "Wikipedia (Group L table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_L",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-23-cro-pan",
    date: "2026-06-23",
    title: "Croatia 1–0 Panama — Budimir keeps Croatia alive, Panama on the brink",
    summary:
      "Ante Budimir's 54th-minute finish gave Croatia a much-needed first win to revive their campaign on three points. A second straight defeat — still without a goal — leaves Panama bottom of Group L and all but out: they can no longer finish in the top two and would have to beat England on the final day, then hope the best-third permutations fall their way, to stay alive.",
    tag: "Result",
    relatedTeams: ["croatia", "panama"],
    relatedMatch: { group: "L", teamA: "croatia", teamB: "panama" },
    prompt: "Who will qualify from Group L?",
    sourceName: "Wikipedia (Group L table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_L",
    verified: true,
    verifiedAt: "2026-06-23",
  },

  // ── 22 June — matchday 2 results: Groups I & J complete, Group G wrapped up ──
  {
    id: "2026-06-22-matchday2-ij",
    date: "2026-06-22",
    title: "Matchday 2: France, Norway and Argentina reach the knockouts; Messi makes history",
    summary:
      "Groups I and J completed their second round and three teams booked round-of-32 places. France beat Iraq 3–0 (Mbappé brace) and Norway edged Senegal 3–2 (Haaland brace) to both qualify from Group I, while Lionel Messi's two goals in Argentina's 2–0 win over Austria — which made him the all-time leading scorer in men's World Cup history — sent the holders through. Algeria beat Jordan 2–1 to stay in the hunt. Overnight, Egypt had completed Group G with a historic first World Cup win over New Zealand.",
    tag: "Standings",
    relatedTeams: ["france", "norway", "argentina", "egypt"],
    prompt: "Who will qualify from Group J?",
  },
  {
    id: "2026-06-22-fra-irq",
    date: "2026-06-22",
    title: "France 3–0 Iraq — Mbappé double sends Les Bleus through",
    summary:
      "Kylian Mbappé struck in each half and Ballon d'Or holder Ousmane Dembélé added a third as France beat Iraq 3–0 — a game played either side of a storm delay of more than two hours in Philadelphia. A second straight win takes France to six points and into the knockout round, while Iraq, still without a point, can no longer finish in the group's top two.",
    tag: "Result",
    relatedTeams: ["france", "iraq"],
    relatedMatch: { group: "I", teamA: "france", teamB: "iraq" },
    prompt: "How far can France go in the tournament?",
    sourceName: "Wikipedia (Group I table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_I",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-22-nor-sen",
    date: "2026-06-22",
    title: "Norway 3–2 Senegal — Haaland double books Norway's spot",
    summary:
      "Marcus Pedersen opened the scoring and Erling Haaland struck twice as Norway survived a late Senegal rally to win 3–2. A Sarr double, including a stoppage-time strike, gave Senegal hope, but Norway held on to make it two wins from two and join France in the knockout round. Senegal stay on zero points.",
    tag: "Result",
    relatedTeams: ["norway", "senegal"],
    relatedMatch: { group: "I", teamA: "senegal", teamB: "norway" },
    prompt: "Who will qualify from Group I?",
    sourceName: "Wikipedia (Group I table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_I",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-22-arg-aut",
    date: "2026-06-22",
    title: "Argentina 2–0 Austria — Messi breaks the World Cup scoring record",
    summary:
      "Lionel Messi scored in each half — the second deep into stoppage time — to give Argentina a 2–0 win over Austria and make him the all-time leading goalscorer in men's World Cup history. The defending champions make it two wins from two and clinch a place in the round of 32; Austria, beaten for the first time, drop to second on three points.",
    tag: "Result",
    relatedTeams: ["argentina", "austria"],
    relatedMatch: { group: "J", teamA: "argentina", teamB: "austria" },
    prompt: "How far can Argentina go in the tournament?",
    sourceName: "Wikipedia (Group J table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_J",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-22-alg-jor",
    date: "2026-06-22",
    title: "Algeria 2–1 Jordan — Desert Warriors come from behind",
    summary:
      "Nizar Al-Rashdan put Jordan ahead, but Nadhir Benbouali and Amine Gouiri struck after the break to turn it around for Algeria. The 2–1 win lifts Algeria to three points, level with Austria in the race for second behind Argentina, while Jordan, still without a point and now unable to finish in the top two, are all but out.",
    tag: "Result",
    relatedTeams: ["algeria", "jordan"],
    relatedMatch: { group: "J", teamA: "algeria", teamB: "jordan" },
    prompt: "Who will qualify from Group J?",
    sourceName: "Wikipedia (Group J table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_J",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    id: "2026-06-22-egy-nzl",
    date: "2026-06-22",
    title: "Egypt 3–1 New Zealand — Salah seals a historic first World Cup win",
    summary:
      "Egypt claimed the first World Cup victory in their history, at the fourth attempt since their 1934 debut. Finn Surman headed New Zealand in front in Vancouver, but Egypt replied with three unanswered second-half goals — an equaliser, then Mohamed Salah and a late Trézéguet strike — to win 3–1. The result, which completed Group G's second round, sends Egypt top of the group on four points; Salah is now the Pharaohs' all-time leading World Cup scorer. Iran and Belgium sit on two points, New Zealand on one.",
    tag: "Result",
    relatedTeams: ["egypt", "new-zealand"],
    relatedMatch: { group: "G", teamA: "egypt", teamB: "new-zealand" },
    prompt: "Who will qualify from Group G?",
    sourceName: "Wikipedia (Group G table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_G",
    verified: true,
    verifiedAt: "2026-06-23",
  },

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
