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
 * Last updated: 2026-07-04 — recorded FOUR more Round-of-32 results, each
 * verified against the football-data.org official World Cup results feed:
 * Spain 3-0 Austria and Portugal 2-1 Croatia (2 July), Switzerland 2-0 Algeria
 * and Argentina 3-2 Cape Verde a.e.t. (3 July). The free feed does not expose
 * goalscorers, so those notes state only the verified result (no invented
 * scorers). Two ties are deliberately HELD: Australia-Egypt (feed reports
 * winner:null with an inconsistent 4-4 shootout — advancing side unresolved)
 * and Colombia-Ghana (still IN_PLAY at update time). Neither is guessed.
 * ── Prior 2026-07-02 (second pass) — knockout-results AUDIT: re-verified
 * every completed knockout tie against fresh sources; all 10 completed R32
 * results (through 1 July) were already recorded and correct, and the six
 * remaining ties (Spain-Austria, Portugal-Croatia, Switzerland-Algeria on
 * 2 July; Australia-Egypt, Argentina-Cape Verde, Colombia-Ghana on 3 July)
 * have NOT been played, so they stay unrecorded. What WAS missing is
 * structured bracket progression: added the `advances` field (set on the two
 * shootout draws — Paraguay over Germany, Morocco over the Netherlands) so
 * the bracket fold in buildSchedule.ts can resolve winners into the Round of
 * 16 instead of leaving played ties as upcoming; also pinned Kane's goal
 * minutes (75', 86') in the England note from the match reports.
 * ── Prior 2026-07-02 — THREE more Round-of-32 results recorded (all
 * played 1 July): England 2-1 DR Congo (Cipenga shocked England on 7', Harry
 * Kane's late double turned it around), Belgium 3-2 Senegal a.e.t. (Belgium
 * trailed 0-2, levelled through Lukaku 86' and Tielemans 89', and Tielemans'
 * extra-time-stoppage penalty — clocked at 124:44, the latest winning goal in
 * World Cup history — won it; stored at the extra-time score, i.e. a Belgium
 * WIN in the Elo fold since no shootout was needed), and USA 2-0 Bosnia and
 * Herzegovina (Balogun scored on 45' then saw red on 64'; ten-man hosts held
 * on, Tillman free kick 81' — the USMNT's first knockout win since 2002).
 * England, Belgium and the USA reach the round of 16; DR Congo, Senegal and
 * Bosnia are out. 10 of the 16 R32 ties are now recorded; still to play:
 * Spain-Austria, Portugal-Croatia, Switzerland-Algeria (2 July) and
 * Australia-Egypt, Argentina-Cape Verde, Colombia-Ghana (3 July). Wikipedia's
 * R32 page truncated on fetch, so these three were cross-checked against
 * ESPN + FIFA + CBS/NBC/Al Jazeera match reports instead (cited per entry).
 * ── Prior 2026-07-01 — THREE more Round-of-32 results recorded (France
 * 3-0 Sweden, Norway 2-1 Ivory Coast, Mexico 2-0 Ecuador). Recording Mexico's
 * game surfaced a bracket mismatch (the resolved R32 field had Mexico facing
 * Senegal, but the real fixture was Mexico v Ecuador) which traced back to a
 * DATA BUG: every matchday-3 score for Groups G–L (recorded 26–27 June,
 * left `verified` unset at the time — see the superseded note this replaces)
 * was actually wrong. Cross-checked and CORRECTED against the Wikipedia group
 * tables on 1 July (now `verified: true`); real matchday-3 for G–L: Belgium
 * 5-1 New Zealand & Egypt 1-1 Iran (BELGIUM win Group G on goal difference,
 * +4 to Egypt's +2 — not Egypt as previously recorded; Iran third but MISS
 * the best-thirds pool), Spain 1-0 Uruguay & Cape Verde 0-0 Saudi Arabia
 * (Spain win Group H as before, Cape Verde through second on 3 draws not a
 * win), France 4-1 Norway & Senegal 5-0 Iraq (France win Group I as before),
 * Argentina 3-1 Jordan & Algeria 3-3 Austria (Argentina top Group J as
 * before; Austria/Algeria level on 4 pts, Austria 2nd on GD), Portugal 0-0
 * Colombia & DR Congo 3-1 Uzbekistan (COLOMBIA win Group K on 7 pts — not
 * Portugal as previously recorded, who finish second on 5), England 2-0
 * Panama & CROATIA 2-1 Ghana (England win Group L as before, but CROATIA are
 * the real runners-up on 6 pts — not Ghana; Ghana finish third on 4 and make
 * the best-thirds pool via that route instead). Net effect: the eight real
 * best-thirds are DR Congo, Sweden, Ecuador, Ghana, Bosnia, Algeria, Paraguay,
 * Senegal (Croatia and Iran — which the old wrong data implied — do NOT
 * qualify; Croatia go through directly as a group runner-up instead). This
 * flowed through to the R32 bracket resolver (`lib/schedule/qualification.ts`
 * + `bracket-2026.ts`), which re-resolved correctly once the group data was
 * fixed — cross-checked against the real Wikipedia knockout-stage fixture
 * list, e.g. Mexico v Ecuador (not Senegal), Colombia v Ghana, Portugal v
 * Croatia, Switzerland v Algeria, Belgium v Senegal, Australia v Egypt.
 * ── Prior 2026-06-30 — the ROUND OF 32 began. First four knockout results
 * recorded (28–29 June), cross-checked and verified: Canada 1-0 South Africa
 * (Eustáquio 90+2'), Paraguay beat Germany on penalties after 1-1 (4-3),
 * Morocco beat the Netherlands on penalties after 1-1 (3-2), Brazil 2-1 Japan
 * (Martinelli 90+5'). Canada, Paraguay, Morocco and Brazil into the last 16;
 * South Africa, Germany, Netherlands and Japan are out. Knockout entries use
 * group "R32" so they fold into the Elo updates but never touch the group
 * standings (shootouts stored at their 1-1 ET score → a draw in the Elo fold;
 * the advancing side is noted). ── Prior 2026-06-27 — matchday-3 (the FINAL
 * ROUND) completed all 12 groups (group stage done); the eight best third-
 * placed teams are resolved from the standings once all results are loaded.
 * ── Prior 2026-06-26: matchday-3 recorded for Groups A–F.
 * 24 June (A–C): Mexico 3-0 Czechia (Mexico win Group A with a perfect 3-0-0,
 * 6 scored & 0 conceded), South Africa 1-0 South Korea (RSA second), Switzerland 2-1
 * Canada (SUI win Group B, CAN second, Bosnia best-third), Bosnia 3-1 Qatar,
 * Brazil 3-0 Scotland (BRA top Group C on GD over Morocco), Morocco 4-2 Haiti.
 * 25 June (D–F): Türkiye 3-2 USA (USA still win Group D despite the loss),
 * Paraguay 0-0 Australia (AUS second on GD), Ivory Coast 2-0 Curaçao (CIV second),
 * Ecuador 2-1 Germany (GER still top Group E on GD), Japan 1-1 Sweden (JPN second),
 * Netherlands 3-1 Tunisia (NED win Group F). All A–F scores
 * cross-checked against the Wikipedia group tables and the prior-round results.
 * ── Prior: 2026-06-23 (later same day) — Groups K & L matchday-2 are now
 * COMPLETE, which finishes the SECOND ROUND across all 12 groups. K: Portugal 5-0
 * Uzbekistan (Ronaldo brace — the first player to score at six different World
 * Cups), Colombia 1-0 DR Congo (Colombia through to the R32). L: England 0-0
 * Ghana, Croatia 1-0 Panama (Panama bottom on zero and all but out). Earlier
 * today Group G finished with Egypt 3-1 New Zealand (21 June — the Pharaohs'
 * first-ever World Cup win), and 22 June completed Groups I & J — France 3-0 Iraq
 * (Mbappé brace), Norway 3-2 Senegal (Haaland brace; France & Norway both
 * through), Argentina 2-0 Austria (Messi brace + the men's World Cup all-time
 * scoring record; Argentina through) and Algeria 2-1 Jordan. All verified against
 * the Wikipedia group tables. Prior rounds: 21 June Group H — Spain 4-0 Saudi
 * Arabia, Cape Verde 2-2 Uruguay; Group G — Belgium 0-0 Iran (10-man). 20 June
 * Groups E & F — Germany 2-1 Ivory Coast, Ecuador 0-0 Curaçao, Netherlands 5-1
 * Sweden, Japan 4-0 Tunisia; 19 June Groups C & D — Morocco 1-0 Scotland, USA 2-0
 * Australia, Brazil 3-0 Haiti, Türkiye 0-1 Paraguay; 18 June Groups A & B —
 * Czechia 1-1 South Africa, Mexico 1-0 South Korea, Switzerland 4-1 Bosnia,
 * Canada 6-0 Qatar.)
 */

export interface ManualMatchResult {
  group: string; // "A" .. "L"
  teamA: string; // slug
  teamB: string; // slug
  scoreA: number;
  scoreB: number;
  date?: string; // YYYY-MM-DD (optional, display only)
  note?: string;
  /**
   * KNOCKOUT ties only: slug of the team that advanced. REQUIRED when the
   * recorded score is a draw (a penalty shootout stored at its regulation/
   * extra-time score — the standard Elo convention), because the winner is not
   * derivable from the score. Optional (derived from the score) for decisive
   * results. Consumed by the bracket-progression fold in buildSchedule.ts;
   * the Elo fold deliberately ignores it (a shootout stays a 0.5/0.5 draw).
   */
  advances?: string;
  // ── Structured verification provenance (all optional, display/metadata only;
  // the prediction engine ignores these). `verified` is set ONLY when the score
  // was cross-checked against an authoritative source (e.g. the official FIFA /
  // Wikipedia group table), never for an in-progress or single-report score. ──
  sourceName?: string; // e.g. "Wikipedia (Group D table)"
  sourceUrl?: string; // canonical source URL
  verified?: boolean; // true = cross-checked against an authoritative source
  verifiedAt?: string; // YYYY-MM-DD the check was performed
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
  // 18 June — matchday 2, Groups A & B.
  {
    group: "A",
    teamA: "czech-republic",
    teamB: "south-africa",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-18",
    note: "Sadilek 6'; Mokoena 83' pen. Czechia made the chances but couldn't finish — the V5.1.2 'Finishing Reality'; SA's verified resistance grabs a point despite the Zwane/Sithole bans (FIFA/Sky)",
  },
  {
    group: "A",
    teamA: "mexico",
    teamB: "south-korea",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-18",
    note: "Romo 50' (GK blunder). Mexico top Group A and are first to qualify — a narrow win, matching the 'Favourite Wins Narrow' read (ESPN/CBS)",
  },
  {
    group: "B",
    teamA: "switzerland",
    teamB: "bosnia-and-herzegovina",
    scoreA: 4,
    scoreB: 1,
    date: "2026-06-18",
    note: "Manzambi brace + Vargas + Xhaka pen. Stumbled-favourite bounce-back validated — Switzerland ran riot late, though 3 goals came after Bosnia's 80' red card (Muharemovic) (Opta/GMA)",
  },
  {
    group: "B",
    teamA: "canada",
    teamB: "qatar",
    scoreA: 6,
    scoreB: 0,
    date: "2026-06-18",
    note: "Jonathan David hat-trick + Larin + Saliba + OG. Canada's first-ever WC win and the 'killing spree' call — Qatar reduced to 9 men (two reds) (ESPN/CBC/Globalnews)",
  },
  // 19 June — matchday 2, Groups C & D (now COMPLETE: all four games confirmed).
  {
    group: "C",
    teamA: "scotland",
    teamB: "morocco",
    scoreA: 0,
    scoreB: 1,
    date: "2026-06-19",
    note: "Saibari 2'. Morocco's early goal held up; Scotland created little against a compact, transition-sharp side. Morocco top Group C on 4 pts — matched the 'narrow win for the stronger, well-organised side' read (Wikipedia/FOX/ESPN)",
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-20",
  },
  {
    group: "D",
    teamA: "usa",
    teamB: "australia",
    scoreA: 2,
    scoreB: 0,
    date: "2026-06-19",
    note: "Burgess own goal 11', Alex Freeman 43'. Co-hosts USA clinch a knockout spot with a second straight win (6 GF, 1 GA) — a clean home-favourite hold (Wikipedia/NBC/ESPN)",
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-20",
  },
  {
    group: "C",
    teamA: "brazil",
    teamB: "haiti",
    scoreA: 3,
    scoreB: 0,
    date: "2026-06-19",
    note: "Cunha 23' & 36', Vinícius Júnior 45'+3' — all three before half-time. Brazil bounce back from the 1-1 vs Morocco with a comfortable win to reach 4 pts and go top of Group C on goal difference (+3 vs Morocco's +1); the 'stumbled quality side cashes in vs a weaker foe' bounce-back read (ESPN/NBC).",
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-20",
  },
  {
    group: "D",
    teamA: "turkey",
    teamB: "paraguay",
    scoreA: 0,
    scoreB: 1,
    date: "2026-06-19",
    note: "Galarza 2' (fastest goal of the tournament). Paraguay played most of the match a man down after Almirón's first-half red but held on; Türkiye wasteful. Paraguay climb to 3 pts (level with Australia); Türkiye stay on 0 and are nearly out (ESPN/FIFA/Yahoo)",
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-20",
  },
  // 20 June — matchday 2, Groups E & F (now COMPLETE: all four games confirmed).
  {
    group: "E",
    teamA: "germany",
    teamB: "ivory-coast",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-20",
    note: "Kessié 30' put Ivory Coast ahead, but Deniz Undav struck twice (68' and 90+4') to win it in stoppage time. Germany come from behind to make it two wins from two, clinch a knockout spot and top Group E on 6 pts — the 'quality favourite finds a way' read after a real scare (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    group: "E",
    teamA: "curacao",
    teamB: "ecuador",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-20",
    note: "A goalless draw in Kansas City: debutants Curaçao's compact low block frustrated Ecuador, who couldn't break it down — the same 'possession side stymied by an organised minnow' pattern as Spain–Cape Verde. Curaçao earn their first-ever World Cup point; both sides on 1 pt, all but out behind Germany & Ivory Coast (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    group: "F",
    teamA: "netherlands",
    teamB: "sweden",
    scoreA: 5,
    scoreB: 1,
    date: "2026-06-20",
    note: "Brobbey (5', 17') and Gakpo (47', 54') both with braces, Summerville added a fifth; Elanga 59' for Sweden. The Netherlands bounce back from the Japan draw with a rout to go top of Group F on goals scored (level with Japan on points and goal difference) — the decisive favourite win the model expects from a stumbled quality side (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group F table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_F",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    group: "F",
    teamA: "japan",
    teamB: "tunisia",
    scoreA: 4,
    scoreB: 0,
    date: "2026-06-20",
    note: "Kamada 4', Ueda brace (31', 83') and Itō 69'. Japan dominate to join the Netherlands on 4 pts (level on GD) and all but seal qualification, while a second straight defeat leaves Tunisia bottom on zero points and on the brink of elimination — a clean stronger-side win over an outmatched opponent (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group F table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_F",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  // 21 June — matchday 2, Groups G & H (both now COMPLETE).
  {
    group: "H",
    teamA: "spain",
    teamB: "saudi-arabia",
    scoreA: 4,
    scoreB: 0,
    date: "2026-06-21",
    note: "Lamine Yamal 10', Mikel Oyarzabal 21' & 24', plus a Hassan Al-Tambakti own goal 49'. Spain answer their shock 0-0 opener against Cape Verde emphatically, sweeping Saudi Arabia aside to lead Group H on 4 pts — the quality favourite reasserting itself after a stumble (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group H table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_H",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    group: "H",
    teamA: "cape-verde",
    teamB: "uruguay",
    scoreA: 2,
    scoreB: 2,
    date: "2026-06-21",
    note: "Kevin Pina 21' and Hélio Varela 61' for Cape Verde; Maxi Araújo 44' and Agustín Canobbio 45+6' for Uruguay. The debutants twice pegged Uruguay back to earn a second straight draw and stay unbeaten — Cape Verde (2 pts) remain in genuine knockout contention; another 'organised newcomer frustrates a CONMEBOL side' result after Spain–Cape Verde (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group H table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_H",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    group: "G",
    teamA: "belgium",
    teamB: "iran",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-21",
    note: "A goalless draw at SoFi Stadium; Belgium saw out the closing half-hour a man down after Nathan Ngoy's 66' red card. Two draws leave Belgium on just 2 pts, with Iran top of Group G on goals scored — the favourite again stumbling in a tight, low-scoring group (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group G table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_G",
    verified: true,
    verifiedAt: "2026-06-21",
  },
  {
    group: "G",
    teamA: "egypt",
    teamB: "new-zealand",
    scoreA: 3,
    scoreB: 1,
    date: "2026-06-21",
    note: "Finn Surman headed New Zealand in front (15') at BC Place in Vancouver, but Egypt hit back with three unanswered second-half goals — an equaliser on 58', then Mohamed Salah (67') and Trézéguet (82'). It is Egypt's first-ever World Cup win, at the fourth attempt since their 1934 debut, and it sends them top of Group G on 4 pts; Salah becomes the Pharaohs' all-time leading World Cup scorer. The group stays wide open — Iran and Belgium are level on 2, New Zealand on 1 (Wikipedia/ESPN/Al Jazeera).",
    sourceName: "Wikipedia (Group G table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_G",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  // 22 June — matchday 2, Groups I & J (both now COMPLETE).
  {
    group: "I",
    teamA: "france",
    teamB: "iraq",
    scoreA: 3,
    scoreB: 0,
    date: "2026-06-22",
    note: "Kylian Mbappé struck either side of half-time (14', 54') and Ballon d'Or holder Ousmane Dembélé added a third (66') as France beat Iraq — through a storm delay of more than two hours at half-time in Philadelphia. A second straight win takes France to 6 pts and into the knockout round; Iraq, still without a point, can no longer finish in the group's top two (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group I table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_I",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    group: "I",
    teamA: "senegal",
    teamB: "norway",
    scoreA: 2,
    scoreB: 3,
    date: "2026-06-22",
    note: "Marcus Pedersen opened the scoring and Erling Haaland struck twice (his second straight brace) as Norway won 3-2 at MetLife Stadium; a Sarr double for Senegal, including a stoppage-time strike, came too late. Norway join France on 6 pts and reach the knockouts; Senegal stay on 0 and can no longer finish in the top two (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group I table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_I",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    group: "J",
    teamA: "argentina",
    teamB: "austria",
    scoreA: 2,
    scoreB: 0,
    date: "2026-06-22",
    note: "Lionel Messi scored in each half (38' and deep into stoppage time, 90+5'), having earlier missed a penalty — goals that made him the all-time leading scorer in men's World Cup history. The holders make it two wins from two, reach 6 pts and clinch their place in the round of 32; Austria, beaten for the first time, drop to second on 3 (Wikipedia/ESPN/Al Jazeera).",
    sourceName: "Wikipedia (Group J table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_J",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    group: "J",
    teamA: "algeria",
    teamB: "jordan",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-22",
    note: "Nizar Al-Rashdan put Jordan ahead (36'), but Nadhir Benbouali (69') and Amine Gouiri (82') turned it around for Algeria after the break. The win lifts Algeria to 3 pts, level with Austria in the race for second behind Argentina; Jordan stay on 0 and, unable now to finish in the top two, are all but out (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group J table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_J",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  // 23 June — matchday 2, Groups K & L (both now COMPLETE; this finishes the
  // second round across all 12 groups).
  {
    group: "K",
    teamA: "portugal",
    teamB: "uzbekistan",
    scoreA: 5,
    scoreB: 0,
    date: "2026-06-23",
    note: "Cristiano Ronaldo scored twice (6', 39') — becoming the first player to score at six different World Cups — with Nuno Mendes (17'), an Abduvohid Nematov own goal (60') and Rafael Leão (87') completing the rout. Ronaldo's first goals of the tournament answer the criticism after Portugal's opening draw; Portugal climb to second in Group K on 4 pts, well placed (though not yet mathematically certain) to join Colombia in the knockouts (Wikipedia/ESPN/Al Jazeera).",
    sourceName: "Wikipedia (Group K table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    group: "K",
    teamA: "dr-congo",
    teamB: "colombia",
    scoreA: 0,
    scoreB: 1,
    date: "2026-06-23",
    note: "Daniel Muñoz's deflected strike (76') finally broke a stubborn DR Congo down to give Colombia a second straight win. Colombia go top of Group K on 6 pts and are through to the round of 32; DR Congo slip to third on 1, Uzbekistan bottom on 0 (Wikipedia/ESPN/NBC).",
    sourceName: "Wikipedia (Group K table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    group: "L",
    teamA: "england",
    teamB: "ghana",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-23",
    note: "A goalless draw at Gillette Stadium: England dominated the chances (19 shots to Ghana's 2) but couldn't break down a disciplined Ghana side. Both move to 4 pts and share the Group L lead — England top on goal difference (+2 to Ghana's +1) — ahead of the final round (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group L table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_L",
    verified: true,
    verifiedAt: "2026-06-23",
  },
  {
    group: "L",
    teamA: "croatia",
    teamB: "panama",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-23",
    note: "Ante Budimir's second-half finish (54') gave Croatia a vital first win at Toronto Stadium to revive their campaign on 3 pts. A second straight defeat leaves Panama bottom on 0 with no goals scored: they can no longer finish in the top two and are all but out — to survive they would have to beat England on the final day and hope the best-third permutations fall their way (the 2026 format sends 8 of 12 third-placed teams through), so they are NOT yet mathematically eliminated (Wikipedia/ESPN/NBC).",
    sourceName: "Wikipedia (Group L table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_L",
    verified: true,
    verifiedAt: "2026-06-23",
  },

  // ── 24 June — matchday 3: Groups A, B & C complete the final round ──
  {
    group: "A",
    teamA: "czech-republic",
    teamB: "mexico",
    scoreA: 0,
    scoreB: 3,
    date: "2026-06-24",
    note: "Goals from Mateo Chávez (55'), Julián Quiñones (61') and Álvaro Fidalgo (90+4') completed a perfect group stage for the hosts — three wins, six scored, none conceded — as Mexico won Group A on 9 pts. Czechia finish bottom on 1 pt and are eliminated (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group A table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_A",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "A",
    teamA: "south-africa",
    teamB: "south-korea",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-24",
    note: "Thapelo Maseko's 63rd-minute strike sent South Africa through as Group A runners-up on 4 pts. South Korea finish third on 3 pts — not eliminated, but needing the best-third permutations across the other groups to fall their way (8 of 12 third-placed teams advance) (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group A table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_A",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "B",
    teamA: "switzerland",
    teamB: "canada",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-24",
    note: "Rubén Vargas (46') and Johan Manzambi (57') put Switzerland in control before Jonathan David's late reply (76'); the Swiss held on to win Group B with 7 pts. Canada had already done enough and qualify as runners-up on 4 pts (ahead of Bosnia on goal difference, +5 to −1) (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group B table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_B",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "B",
    teamA: "bosnia-and-herzegovina",
    teamB: "qatar",
    scoreA: 3,
    scoreB: 1,
    date: "2026-06-24",
    note: "Bosnia & Herzegovina beat Qatar 3–1 to finish third in Group B on 4 pts and enter the best-thirds pool. Qatar end bottom on 1 pt and are eliminated (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group B table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_B",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "C",
    teamA: "scotland",
    teamB: "brazil",
    scoreA: 0,
    scoreB: 3,
    date: "2026-06-24",
    note: "Vinícius Júnior scored twice (7', 45+3') and Matheus Cunha added a third as Brazil won 3–0 to top Group C on 7 pts — ahead of Morocco on goal difference (+6 to +3), the two sides level on points. Scotland finish third on 3 pts and must wait on the best-thirds maths (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "C",
    teamA: "morocco",
    teamB: "haiti",
    scoreA: 4,
    scoreB: 2,
    date: "2026-06-24",
    note: "Morocco beat Haiti 4–2 — Achraf Hakimi, Ismael Saibari, Soufiane Rahimi and Gessime Yassine all on the scoresheet — to qualify as Group C runners-up on 7 pts. Haiti finish bottom with three defeats and are eliminated (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group C table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_C",
    verified: true,
    verifiedAt: "2026-06-26",
  },

  // ── 25 June — matchday 3: Groups D, E & F complete the final round ──
  {
    group: "D",
    teamA: "turkey",
    teamB: "usa",
    scoreA: 3,
    scoreB: 2,
    date: "2026-06-25",
    note: "Türkiye won a thriller 3–2 — Kaan Ayhan's strike deep into stoppage time (90+8') settling it after Arda Güler (10') and Barış Alper Yılmaz (31') had been pegged back — but the hosts had already secured top spot. The USA win Group D on 6 pts; Türkiye finish bottom on 3 and are eliminated despite the victory (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "D",
    teamA: "paraguay",
    teamB: "australia",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-25",
    note: "A goalless draw sent Australia through as Group D runners-up on 4 pts, edging Paraguay on goal difference (0 to −2) — the two level on points. Paraguay finish third on 4 pts and carry their case into the best-thirds standings (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group D table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "E",
    teamA: "curacao",
    teamB: "ivory-coast",
    scoreA: 0,
    scoreB: 2,
    date: "2026-06-25",
    note: "Nicolas Pépé scored twice (7', 64') as Ivory Coast won 2–0 to take second in Group E on 6 pts (behind Germany only on goal difference, +6 to +2). Curaçao finish bottom on 1 pt and are eliminated (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "E",
    teamA: "ecuador",
    teamB: "germany",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-25",
    note: "Ecuador stunned Germany 2–1 — Nilson Angulo (9') and Gonzalo Plata (77') overturning Leroy Sané's early opener (2') — but Germany still topped Group E on 6 pts thanks to a superior goal difference (+6). Ecuador finish third on 4 pts and enter the best-thirds race (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group E table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_E",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "F",
    teamA: "japan",
    teamB: "sweden",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-25",
    note: "Daizen Maeda (56') and Anthony Elanga (62') traded goals in a 1–1 draw. Japan qualify as Group F runners-up on 5 pts; Sweden finish third on 4 pts and join the best-thirds pool (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group F table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_F",
    verified: true,
    verifiedAt: "2026-06-26",
  },
  {
    group: "F",
    teamA: "tunisia",
    teamB: "netherlands",
    scoreA: 1,
    scoreB: 3,
    date: "2026-06-25",
    note: "The Netherlands won 3–1 — Brian Brobbey and Jan Paul van Hecke scoring either side of an early own goal — to win Group F on 7 pts. Tunisia finish bottom with three defeats and are eliminated (Wikipedia/ESPN).",
    sourceName: "Wikipedia (Group F table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_F",
    verified: true,
    verifiedAt: "2026-06-26",
  },

  // ── 26 June — matchday 3: Groups G, H & I complete the final round ──
  // Entered through the manual layer on the day of the games; NOT yet
  // cross-checked against an authoritative table, so `verified` is left unset.
  {
    group: "G",
    teamA: "belgium",
    teamB: "new-zealand",
    scoreA: 5,
    scoreB: 1,
    date: "2026-06-26",
    note: "Belgium finally clicked in style, thrashing New Zealand 5–1 to finish Group G on 5 pts and +4 goal difference — enough to take top spot ahead of Egypt, who also finished on 5 pts but a lower +2 goal difference. New Zealand finish bottom on 1 pt and are out.",
    sourceName: "Wikipedia (Group G table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_G",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "G",
    teamA: "egypt",
    teamB: "iran",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-26",
    note: "Egypt's 1–1 draw with Iran leaves them second in Group G on 5 pts and +2 goal difference — Belgium's late 5–1 win over New Zealand took the group on goal difference (+4 to +2) instead. Both Belgium and Egypt are through. Iran draw all three games to finish third on 3 pts and miss out on the best-thirds pool.",
    sourceName: "Wikipedia (Group G table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_G",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "H",
    teamA: "spain",
    teamB: "uruguay",
    scoreA: 1,
    scoreB: 0,
    date: "2026-06-26",
    note: "Spain closed out the group with a narrow 1–0 win away to Uruguay, finishing Group H on 7 pts. Uruguay's defeat leaves them third on 2 pts — a chastening group after draws with both Saudi Arabia and Cape Verde; they miss out on the best-thirds pool.",
    sourceName: "Wikipedia (Group H table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_H",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "H",
    teamA: "cape-verde",
    teamB: "saudi-arabia",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-26",
    note: "Cape Verde's third straight draw — 0–0 with Saudi Arabia — sends the debutants through to the round of 32 as Group H runners-up on 3 pts, unbeaten across all three games. The organised low block the model profiled after Spain 0–0 Cape Verde held up all tournament. Saudi Arabia finish bottom on 2 pts (behind Uruguay on goal difference) and are out.",
    sourceName: "Wikipedia (Group H table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_H",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "I",
    teamA: "france",
    teamB: "norway",
    scoreA: 4,
    scoreB: 1,
    date: "2026-06-26",
    note: "Top spot already secured for both, but France cruised past Norway 4–1 to finish Group I with a perfect nine points. Norway qualify second on 6 pts. Both are into the knockouts.",
    sourceName: "Wikipedia (Group I table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_I",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "I",
    teamA: "senegal",
    teamB: "iraq",
    scoreA: 5,
    scoreB: 0,
    date: "2026-06-26",
    note: "Senegal signed off in style, hammering Iraq 5–0 to finish third on 3 pts and +2 goal difference — enough for the best-thirds pool after two opening defeats. Iraq end the group stage with three losses, no points, and are eliminated.",
    sourceName: "Wikipedia (Group I table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_I",
    verified: true,
    verifiedAt: "2026-07-01",
  },

  // ── 27 June — matchday 3: Groups J, K & L complete the final round (and the
  // group stage). CORRECTED 2026-07-01: this batch (like the 26 June G/H/I
  // batch above) was entered same-day and left unverified — cross-checking
  // against the Wikipedia group tables on 1 July found every score in this
  // 26-27 June matchday-3 batch was wrong. Fixed here; see the file header
  // for the standings/bracket consequences (Belgium not Egypt won Group G,
  // Colombia not Portugal won Group K, Croatia not Ghana was the Group L
  // runner-up).
  {
    group: "J",
    teamA: "argentina",
    teamB: "jordan",
    scoreA: 3,
    scoreB: 1,
    date: "2026-06-27",
    note: "With top spot already secured, Argentina rotated but still beat Jordan 3–1 to finish Group J on a perfect nine points. Jordan end with three defeats and are eliminated.",
    sourceName: "Wikipedia (Group J table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_J",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "J",
    teamA: "algeria",
    teamB: "austria",
    scoreA: 3,
    scoreB: 3,
    date: "2026-06-27",
    note: "A wild 3–3 draw settled second and third: Austria finish on 4 pts and progress as Group J runners-up on goal difference (0 to Algeria's −2). Algeria also reach 4 pts but finish third — enough for the best-thirds pool.",
    sourceName: "Wikipedia (Group J table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_J",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "K",
    teamA: "portugal",
    teamB: "colombia",
    scoreA: 0,
    scoreB: 0,
    date: "2026-06-27",
    note: "A goalless draw between two already-qualified sides. Colombia's point is enough to win Group K on 7 pts; Portugal, held again after their big win over Uzbekistan, finish second on 5 pts. Both go through to the knockouts.",
    sourceName: "Wikipedia (Group K table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "K",
    teamA: "dr-congo",
    teamB: "uzbekistan",
    scoreA: 3,
    scoreB: 1,
    date: "2026-06-27",
    note: "DR Congo signed off with a 3–1 win over Uzbekistan to finish third in Group K on 4 pts and a positive goal difference — enough for the best-thirds pool. Debutants Uzbekistan lose all three and are eliminated.",
    sourceName: "Wikipedia (Group K table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "L",
    teamA: "england",
    teamB: "panama",
    scoreA: 2,
    scoreB: 0,
    date: "2026-06-27",
    note: "England comfortably saw off Panama 2–0 to win Group L on 7 pts. Panama finish bottom with three defeats, no goals scored, and are eliminated.",
    sourceName: "Wikipedia (Group L table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_L",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "L",
    teamA: "croatia",
    teamB: "ghana",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-27",
    note: "Croatia's 2–1 win over Ghana sends them through as Group L runners-up on 6 pts. Ghana finish third on 4 pts, but the resistance the model profiled after their goalless draw with England is enough to carry them into the best-thirds pool anyway.",
    sourceName: "Wikipedia (Group L table)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_L",
    verified: true,
    verifiedAt: "2026-07-01",
  },

  // ── ROUND OF 32 (knockouts begin) ──────────────────────────────────────
  // 28–29 June. These are NOT group games: `group` is set to "R32" so they
  // never touch the group standings (buildSchedule/standings only match group
  // pairings), but they DO fold into the post-match Elo updates the same way
  // every other result does. Penalty-shootout matches are recorded at their
  // regulation/extra-time score (a 1–1 draw → 0.5/0.5 in the Elo fold, the
  // standard convention); the shootout winner who advances is named in `note`.
  // Cross-checked against the Wikipedia knockout-stage table + FIFA match centre.
  {
    group: "R32",
    teamA: "south-africa",
    teamB: "canada",
    scoreA: 0,
    scoreB: 1,
    date: "2026-06-28",
    note: "The knockouts opened with the all-runners-up tie (2A v 2B): co-hosts Canada edged South Africa 1–0 on a Stephen Eustáquio strike deep in stoppage time (90+2'), reaching the round of 16. South Africa, who had impressed in second behind Mexico in Group A, go out.",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-06-30",
  },
  {
    group: "R32",
    teamA: "germany",
    teamB: "paraguay",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-29",
    advances: "paraguay",
    note: "Group E winners Germany were stunned on penalties: Julio Enciso put Paraguay ahead (42'), Kai Havertz levelled (54'), and after 1–1 through extra time Paraguay held their nerve to win the shootout 4–3 and reach the last 16. One of the biggest upsets of the round — a major scalp for CONMEBOL. (Recorded as a 1–1 draw for the Elo fold; Paraguay advance.)",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-06-30",
  },
  {
    group: "R32",
    teamA: "netherlands",
    teamB: "morocco",
    scoreA: 1,
    scoreB: 1,
    date: "2026-06-29",
    advances: "morocco",
    note: "Another shootout, another fallen European heavyweight: Cody Gakpo's opener (72') was cancelled out by Issa Diop at the death (90+1'), and Morocco beat the Netherlands 3–2 on penalties after 1–1 to march into the round of 16. Morocco carry their 2022 semi-final pedigree into the knockouts. (Recorded as a 1–1 draw for the Elo fold; Morocco advance.)",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-06-30",
  },
  {
    group: "R32",
    teamA: "brazil",
    teamB: "japan",
    scoreA: 2,
    scoreB: 1,
    date: "2026-06-29",
    note: "Brazil needed a late winner to see off a stubborn Japan: Kaishū Sano gave Japan a shock lead (29'), Casemiro headed the equaliser (56'), and Gabriel Martinelli settled it in the fifth minute of stoppage time (90+5') for a 2–1 win. Brazil into the last 16; Japan, second in Group F, exit with credit.",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-06-30",
  },
  {
    group: "R32",
    teamA: "france",
    teamB: "sweden",
    scoreA: 3,
    scoreB: 0,
    date: "2026-06-30",
    note: "France cruised into the last 16: Kylian Mbappé scored twice and Bradley Barcola added another in a comfortable 3–0 win over Sweden — the third-placed Group F qualifier no match for the group-I winners.",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "R32",
    teamA: "ivory-coast",
    teamB: "norway",
    scoreA: 1,
    scoreB: 2,
    date: "2026-06-30",
    note: "Norway won a World Cup knockout game for the first time: Antonio Nusa's 39' finish (assist Ødegaard) was cancelled out by Amad Diallo (74'), before Erling Haaland's 86' close-range finish settled it 2–1 for Norway, who face five-time champions Brazil in the round of 16.",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "R32",
    teamA: "mexico",
    teamB: "ecuador",
    scoreA: 2,
    scoreB: 0,
    date: "2026-06-30",
    note: "Co-hosts Mexico ended a 40-year wait for a World Cup knockout win: Julián Quiñones (22') and Raúl Jiménez (31') scored inside the first half hour, and Mexico held on 2–0 over Group E's best-third qualifier Ecuador to reach the round of 16, where they face the winner of England v DR Congo.",
    sourceName: "Wikipedia (2026 FIFA World Cup knockout stage)",
    sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    verified: true,
    verifiedAt: "2026-07-01",
  },
  {
    group: "R32",
    teamA: "england",
    teamB: "dr-congo",
    scoreA: 2,
    scoreB: 1,
    date: "2026-07-01",
    note: "England came from behind to reach the round of 16: Brian Cipenga stunned them on 7' and best-thirds qualifier DR Congo led for most of the game, before Harry Kane headed level (75') and lashed home the winner from just inside the box four minutes from time (86'). England now meet co-hosts Mexico in Mexico City in the last 16; DR Congo exit with real credit.",
    sourceName: "ESPN match report (cross-checked vs FIFA + englandfootball.com)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760495/congo-dr-england",
    verified: true,
    verifiedAt: "2026-07-02",
  },
  {
    group: "R32",
    teamA: "belgium",
    teamB: "senegal",
    scoreA: 3,
    scoreB: 2,
    date: "2026-07-01",
    note: "An extra-time epic in Seattle: Habib Diarra and Ismaïla Sarr struck either side of half-time to put Senegal 2–0 up, but half-time sub Romelu Lukaku pulled one back (86') and captain Youri Tielemans headed level (89'). Tielemans then converted a penalty in extra-time stoppage — clocked at 124:44, the latest winning goal in World Cup history — to send Belgium through 3–2 a.e.t. (Recorded at the extra-time score: a Belgium win in the Elo fold, no shootout needed.) Belgium stay in Seattle to face the USA in the round of 16.",
    sourceName: "ESPN match report (cross-checked vs NBC News + Al Jazeera)",
    sourceUrl: "https://www.espn.com/soccer/match/_/gameId/760493/senegal-belgium",
    verified: true,
    verifiedAt: "2026-07-02",
  },
  {
    group: "R32",
    teamA: "usa",
    teamB: "bosnia-and-herzegovina",
    scoreA: 2,
    scoreB: 0,
    date: "2026-07-01",
    note: "Co-hosts USA won a World Cup knockout game for the first time since 2002 (and only the second time ever): Folarin Balogun scored on 45' but was sent off on 64' after video review, and the ten-man hosts held on — Malik Tillman's 81' free kick sealing 2–0 over Bosnia and Herzegovina at Levi's Stadium. All three co-hosts are through to the round of 16, where the USA meet Belgium in Seattle — without the suspended Balogun.",
    sourceName: "CBS News match report (cross-checked vs ESPN + NPR + NBC Sports)",
    sourceUrl: "https://www.cbsnews.com/news/world-cup-us-bosnia-herzegovina-round-of-32/",
    verified: true,
    verifiedAt: "2026-07-02",
  },
  // ── 2 July Round-of-32 ties (verified against the football-data.org official
  //    results feed on 4 July; that free feed does not expose goalscorers, so
  //    these notes deliberately state only the verified result — no invented
  //    scorers/minutes/venues). ──
  {
    group: "R32",
    teamA: "spain",
    teamB: "austria",
    scoreA: 3,
    scoreB: 0,
    date: "2026-07-02",
    note: "Spain were comfortable against Austria, leading 1–0 at the break and pulling away to a 3–0 win in regulation to reach the round of 16. (Score verified via the football-data.org official World Cup results feed; goalscorer detail not yet cross-checked against a match report, so it is intentionally omitted here.)",
    sourceName: "football-data.org (FIFA World Cup official results feed)",
    sourceUrl: "https://api.football-data.org/v4/competitions/WC/matches",
    verified: true,
    verifiedAt: "2026-07-04",
  },
  {
    group: "R32",
    teamA: "portugal",
    teamB: "croatia",
    scoreA: 2,
    scoreB: 1,
    date: "2026-07-02",
    note: "A goalless first half gave way to a 2–1 Portugal win over Croatia in regulation, sending Portugal into the round of 16. (Score verified via the football-data.org official World Cup results feed; goalscorer detail not yet cross-checked, so it is intentionally omitted here.)",
    sourceName: "football-data.org (FIFA World Cup official results feed)",
    sourceUrl: "https://api.football-data.org/v4/competitions/WC/matches",
    verified: true,
    verifiedAt: "2026-07-04",
  },
  // ── 3 July Round-of-32 ties (verified via football-data.org on 4 July). ──
  {
    group: "R32",
    teamA: "switzerland",
    teamB: "algeria",
    scoreA: 2,
    scoreB: 0,
    date: "2026-07-03",
    note: "Switzerland led Algeria 1–0 at half-time and closed out a 2–0 win in regulation to advance to the round of 16. (Score verified via the football-data.org official World Cup results feed; goalscorer detail not yet cross-checked, so it is intentionally omitted here.)",
    sourceName: "football-data.org (FIFA World Cup official results feed)",
    sourceUrl: "https://api.football-data.org/v4/competitions/WC/matches",
    verified: true,
    verifiedAt: "2026-07-04",
  },
  {
    group: "R32",
    teamA: "argentina",
    teamB: "cape-verde",
    scoreA: 3,
    scoreB: 2,
    date: "2026-07-03",
    note: "Argentina were pushed to extra time by a spirited Cape Verde before winning 3–2 a.e.t. to reach the round of 16. (Recorded at the extra-time score: a decisive Argentina win in the Elo fold, no shootout. Score verified via the football-data.org official World Cup results feed; goalscorer detail not yet cross-checked, so it is intentionally omitted here.)",
    sourceName: "football-data.org (FIFA World Cup official results feed)",
    sourceUrl: "https://api.football-data.org/v4/competitions/WC/matches",
    verified: true,
    verifiedAt: "2026-07-04",
  },
  // NOTE: two 3–4 July R32 ties are deliberately NOT recorded yet —
  //   • Australia v Egypt (3 Jul) finished FINISHED in the feed but with
  //     winner:null and an inconsistent 4–4 shootout line (regulation 1–1,
  //     extra time 0–0), so the advancing side is not yet resolvable from the
  //     source. A knockout draw REQUIRES a verified `advances`, so it is held.
  //   • Colombia v Ghana (4 Jul) was still IN_PLAY (0–0) at the time of this
  //     update. Neither is guessed — they will be added once the source settles.
];
