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
 * Last updated: 2026-06-18 (through the early/mid 18 June matchday-2 games:
 * Czechia 1-0 South Africa, Switzerland 1-1 Bosnia, Canada 1-1 Qatar. The two
 * favourites the match-type classifier tagged "Fade Favourite" — Switzerland &
 * Canada — were both held to draws. Mexico–South Korea kicks off late and is
 * not yet recorded. The 17 June England 4-2 rout motivated the high-kill draw
 * dampener in drawPropensity.ts).
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
  // 14 June — Groups E & F open
  {
    group: "E",
    teamA: "germany",
    teamB: "curacao",
    scoreA: 7,
    scoreB: 1,
    date: "2026-06-14",
    note: "Germany run riot on their opener",
  },
  {
    group: "E",
    teamA: "ivory-coast",
    teamB: "ecuador",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-14",
    note: "Ivory Coast edge Ecuador",
  },
  {
    group: "F",
    teamA: "netherlands",
    teamB: "japan",
    scoreA: 2,
    scoreB: 2,
    date: "2026-06-14",
    note: "Japan twice peg back the Netherlands",
  },
  {
    group: "F",
    teamA: "sweden",
    teamB: "tunisia",
    scoreA: 5,
    scoreB: 1,
    date: "2026-06-14",
  },
  // 15 June — Groups G & H open. All four games drawn (favourites all dropped
  // points): a notable "wild Monday" the model under-weighted (see the tactical-
  // matchup + value-weighted-injury layers added 16 June).
  {
    group: "G",
    teamA: "belgium",
    teamB: "egypt",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-15",
    note: "Ashour put Egypt ahead; a Lukaku-sparked own goal levelled it (ESPN)",
  },
  {
    group: "G",
    teamA: "iran",
    teamB: "new-zealand",
    scoreA: 2,
    scoreB: 2,
    date: "2026-06-15",
    note: "Elijah Just brace for NZ; Rezaeian + Mohebbi pegged it back (Al Jazeera)",
  },
  {
    group: "H",
    teamA: "spain",
    teamB: "cape-verde",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-15",
    note: "Debutants' low block + keeper Vozinha hold Spain (27 shots) — historic point (ESPN)",
  },
  {
    group: "H",
    teamA: "saudi-arabia",
    teamB: "uruguay",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-15",
    note: "Al-Amri 40'; Maxi Araújo levelled late. Uruguay missing Araújo/Giménez at CB (Sky)",
  },
  // 16 June — Groups I & J open. Favourites all won decisively (the mirror
  // image of 15 June's four draws — a reminder the draw cluster was partly noise).
  {
    group: "I",
    teamA: "france",
    teamB: "senegal",
    scoreA: 3,
    scoreB: 1,
    date: "2026-06-16",
    note: "Mbappé brace (now France's all-time top scorer) + Barcola; Senegal late consolation (ESPN)",
  },
  {
    group: "I",
    teamA: "iraq",
    teamB: "norway",
    scoreA: 1,
    scoreB: 4,
    date: "2026-06-16",
    note: "Haaland brace; Norway cruise (Al Jazeera/NBC)",
  },
  {
    group: "J",
    teamA: "argentina",
    teamB: "algeria",
    scoreA: 3,
    scoreB: 0,
    date: "2026-06-16",
    note: "Messi first World Cup hat-trick, equals Klose milestone talk (NBC)",
  },
  {
    group: "J",
    teamA: "austria",
    teamB: "jordan",
    scoreA: 3,
    scoreB: 1,
    date: "2026-06-16",
    note: "Olwan's historic first WC goal for Jordan; Austria pull away late inc. VAR pen (ESPN)",
  },
  // 17 June — Groups K & L open.
  {
    group: "K",
    teamA: "portugal",
    teamB: "dr-congo",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-17",
    note: "Ronaldo blank (0 in 10 WC group games); DR Congo's resistance + transition earn a point. Portugal missing Rúben Dias (NBC/ESPN)",
  },
  {
    group: "K",
    teamA: "uzbekistan",
    teamB: "colombia",
    scoreA: 1,
    scoreB: 3,
    date: "2026-06-17",
    note: "Colombia's individual quality too much for the debutants (NBC)",
  },
  {
    group: "L",
    teamA: "england",
    teamB: "croatia",
    scoreA: 4,
    scoreB: 2,
    date: "2026-06-17",
    note: "Kane brace (2 pens), Bellingham, Rashford; Baturina + Musa for Croatia. High-kill favourite broke the resistance (ESPN)",
  },
  {
    group: "L",
    teamA: "ghana",
    teamB: "panama",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-17",
    note: "Late winner; Ghana edge it despite missing Kudus/Salisu (whole tournament) + Partey (denied entry, this match) — the 'Ghana small win' script (NBC)",
  },
  // 18 June — matchday 2 for Groups A & B. (Mexico–South Korea kicks off late,
  // not yet played.) Both favourites the model tagged "Fade Favourite" were held.
  {
    group: "A",
    teamA: "czech-republic",
    teamB: "south-africa",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-18",
    note: "Krejčí winner (Coufal assist); South Africa — down suspended Zwane & Sithole — lose again and are all but out. The model's narrow-favourite read (ESPN)",
  },
  {
    group: "B",
    teamA: "switzerland",
    teamB: "bosnia-and-herzegovina",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-18",
    note: "Embolo opener cancelled by Lukić — the model's 'Fade Favourite' call lands: Switzerland favoured but blunt vs Bosnia's resilient block (ESPN)",
  },
  {
    group: "B",
    teamA: "canada",
    teamB: "qatar",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-18",
    note: "Larin for Canada; Qatar's deep block holds for a 2nd straight 1-1. Davies still absent — another 'Fade Favourite' draw (FOX/ESPN)",
  },
];
