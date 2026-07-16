/**
 * Pre-match intelligence layer — structured, SOURCED match-day news turned into
 * a capped, fixture-specific model adjustment + a transparent narrative.
 *
 * WHY THIS EXISTS (and how it differs from every other layer):
 *   • ratings / ratingUpdates / availability / confederationForm / tactical /
 *     drawPropensity are all standing model machinery.
 *   • THIS layer is per-FIXTURE, time-boxed news: a player denied entry for one
 *     city, a suspension that bites a single match, a confirmed late withdrawal,
 *     a rumour that only dents our confidence. Each item carries its own source,
 *     confidence and expiry (`expiresAfterMatch`).
 *
 * STRICT RULES (so news can never quietly rewrite the model):
 *   1. status: "confirmed" | "rumor" | "opinion".
 *        – ONLY `confirmed` items move the Elo / goal model.
 *        – `rumor` / `opinion` move NOTHING but the confidence score + the
 *          written preview (getIntelUncertainty). No probability is touched.
 *   2. Every item needs a real sourceUrl + a confidence in [0,1]. No unsourced
 *      rumour is allowed to change a number.
 *   3. Each item's model impact is an Elo-equivalent = deltaElo + deltaAttack +
 *      deltaDefense (negative = weaker). Per team PER FIXTURE these are summed
 *      then CLAMPED to ±INTEL_CAP, so one headline can't flip a strength gap.
 *   4. Match-specific by construction: an item is keyed to (team, opponent), so
 *      Partey being barred from the Toronto game touches ONLY Ghana–Panama, not
 *      Ghana's later fixtures. Tournament-long absences (Kudus, Salisu …) belong
 *      in availabilityAdjustments.ts instead, so they apply to every game.
 *   5. Don't double-count: competitive results are already absorbed by the Elo
 *      result-update layer, and recurring style clashes by tacticalMatchups.ts —
 *      so tactical/motivation reads here are `opinion` (narrative only, delta 0),
 *      and we never add a "they won their last game" form bonus.
 *
 * WARMUP / RECENT-FORM RELIABILITY (section D): a friendly result may only feed
 * a `warmup_reliability` item, and only as `confirmed` with a real source when
 * the warm-up was a true first-choice run-out; if the XI was rotated / injury-
 * protected / under a new coach still bedding in, it stays `opinion` (narrative,
 * delta 0). Competitive results never re-enter here — they are in Elo already.
 *
 * The breakdown surfaces every confirmed item's delta; the agent preview lists
 * the rumours/opinions separately as context.
 *
 * Last updated: 2026-07-17 — FINAL WEEK: Spain-Argentina final intel (both
 * squads clean — Williams/Pino recoveries priced in the availability layer,
 * delta 0 here; Romero fit for Argentina; Scaloni's tipped De Paul/Montiel
 * changes carried as a lineup RUMOUR) + France-England third-place motivation
 * reads (Tuchel's "nobody wants to play this match", Deschamps chasing a third
 * straight top-3) as opinion items — uncertainty only, no probability moved.
 * ── Prior 2026-07-02 — Round-of-32 intel for tonight: Spain-Austria (Yamal starts, Rangnick man-plan), Portugal-Croatia (clean tables, Modrić workload read), Switzerland-Algeria (Amoura highly doubtful -6 att × 0.75 out-chance, Widmer 50/50, Petković-derby narrative).
 */

import { getTeam } from "@/lib/seed/world-cup-2026-groups";

export type IntelStatus = "confirmed" | "rumor" | "opinion";
export type IntelType =
  | "availability"
  | "lineup"
  | "motivation"
  | "tactical"
  | "coach"
  | "warmup_reliability"
  | "media_noise";

export interface PreMatchIntel {
  /** Readable fixture id for grouping (matching is by team+opponent slugs). */
  matchId: string;
  /** Slug the item is ABOUT. */
  team: string;
  /** Slug of the opponent in this fixture. */
  opponent: string;
  type: IntelType;
  status: IntelStatus;
  summary: string;
  impactDirection: "positive" | "negative" | "neutral";
  /** Elo-equivalent components (negative = weaker). Summed for confirmed items. */
  deltaElo?: number;
  deltaAttack?: number;
  deltaDefense?: number;
  /**
   * Probability the player IS available (0–1). For DOUBTFUL/questionable cases:
   * the EXPECTED impact is the full-out delta × the chance he is actually out
   * (1 − availabilityProb), so we never treat a "doubt" as a 100% withdrawal.
   * Omit for clear-cut items (full impact applies).
   */
  availabilityProb?: number;
  /** 0–1 source/strength confidence. */
  confidence: number;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string; // YYYY-MM-DD
  /** All entries here are time-boxed to a single fixture. */
  expiresAfterMatch: true;
}

/** Max absolute Elo a team's CONFIRMED intel may move it in a single fixture. */
export const INTEL_CAP = 35;

/**
 * Confirmed = model-moving, sourced. Rumor/opinion = narrative + confidence only.
 * Every entry has a real sourceUrl (see the WebSearch sources in the report).
 */
export const PRE_MATCH_INTEL: PreMatchIntel[] = [
  // ── 2 Jul · Portugal vs Croatia (Round of 32) ───────────────────────────
  {
    matchId: "portugal-vs-croatia", team: "portugal", opponent: "croatia",
    type: "lineup", status: "confirmed",
    summary: "Clean injury table — Portugal reach the knockouts with no reported concerns, and the rested PSG double-pivot (João Neves, Vitinha) returns after rotation against Colombia. Full-strength XI expected around Ronaldo.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.8,
    sourceName: "Sports Mole / RotoWire (team news)", sourceUrl: "https://www.sportsmole.co.uk/football/portugal/world-cup-2026/preview/portugal-vs-croatia-prediction-team-news-lineups_600433.html",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },
  {
    matchId: "portugal-vs-croatia", team: "croatia", opponent: "portugal",
    type: "lineup", status: "opinion",
    summary: "No injuries reported, but the 40-year-old Modrić's workload is the watch-item — Dalić has leaned on him all group stage and needs him fresh for a possible 120 minutes. A fatigue read, not a confirmed absence; narrative only.",
    impactDirection: "negative", deltaElo: 0, confidence: 0.5,
    sourceName: "RotoWire (preview)", sourceUrl: "https://www.rotowire.com/soccer/article/portugal-vs-croatia-preview-predicted-lineups-team-news-tactical-analysis-2026-world-cup-round-of-32-120534",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },

  // ── 2 Jul · Switzerland vs Algeria (Round of 32) ────────────────────────
  {
    matchId: "switzerland-vs-algeria", team: "algeria", opponent: "switzerland",
    type: "availability", status: "confirmed",
    summary: "Striker Mohamed Amoura (Wolfsburg) HIGHLY DOUBTFUL — the front line reshuffles around Mahrez, Maza, Chaibi and Gouiri. Expected impact discounted by his residual chance of featuring.",
    impactDirection: "negative", deltaAttack: -6, availabilityProb: 0.25, confidence: 0.7,
    sourceName: "RotoWire / Khel Now (team news)", sourceUrl: "https://www.rotowire.com/soccer/article/switzerland-vs-algeria-preview-predicted-lineups-team-news-tactical-analysis-2026-world-cup-round-of-32-120535",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },
  {
    matchId: "switzerland-vs-algeria", team: "switzerland", opponent: "algeria",
    type: "availability", status: "confirmed",
    summary: "Silvan Widmer the only doubt (not yet ruled out); Jaquez impressed at full-back and is expected to keep the spot regardless — a depth note more than a hole.",
    impactDirection: "negative", deltaDefense: -2, availabilityProb: 0.5, confidence: 0.6,
    sourceName: "Sports Mole / RotoWire (team news)", sourceUrl: "https://www.rotowire.com/soccer/article/switzerland-vs-algeria-preview-predicted-lineups-team-news-tactical-analysis-2026-world-cup-round-of-32-120535",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },
  {
    matchId: "switzerland-vs-algeria", team: "algeria", opponent: "switzerland",
    type: "coach", status: "opinion",
    summary: "Petković derby: Algeria's coach spent seven years building this Switzerland side and is chasing Algeria's first-ever World Cup knockout win against it. Inside knowledge of the opponent cuts both ways — narrative only.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.5,
    sourceName: "FIFA (match preview)", sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/switzerland-algeria-live-stream-team-news-tickets-and-more",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },

  // ── 2 Jul · Spain vs Austria (Round of 32) ──────────────────────────────
  // NOTE: the Williams/Pino injuries and the Mwene absence are TOURNAMENT-
  // phase (multi-game) and live in availabilityAdjustments.ts per rule 4 —
  // here we only carry the fixture-specific presser reads, delta 0, so
  // nothing is double-counted.
  {
    matchId: "spain-vs-austria", team: "spain", opponent: "austria",
    type: "lineup", status: "confirmed",
    summary: "Lamine Yamal starts — back from the April hamstring, scored vs Saudi Arabia, but Spain are still managing his minutes (141 across the group stage, subbed at half-time last time out). His availability discount is already updated in the squad layer; no extra delta here.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.85,
    sourceName: "VAVEL / Sports Illustrated (predicted line-ups)", sourceUrl: "https://www.vavel.com/en/international-football/2026/07/01/1264926-spain-vs-austria-world-cup-preview-can-lamine-yamal-begin-to-shine.html",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },
  {
    matchId: "spain-vs-austria", team: "austria", opponent: "spain",
    type: "tactical", status: "opinion",
    summary: "Rangnick's presser: stopping Yamal is the plan — \"watch very closely… not to give him a lot of room or too many opportunities to start his dribbling actions.\" A stated man-plan from a coach who beat expectations all group stage; narrative only (style effects live in the tactical layer).",
    impactDirection: "positive", deltaElo: 0, confidence: 0.5,
    sourceName: "bdnews24 / FIFA (Rangnick press conference)", sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/austria-ralf-rangnick-lost-time",
    publishedAt: "2026-07-01", expiresAfterMatch: true,
  },

  // ── 17 Jun · Portugal vs DR Congo (Group K) ─────────────────────────────
  {
    matchId: "portugal-vs-dr-congo", team: "portugal", opponent: "dr-congo",
    type: "availability", status: "confirmed",
    summary: "Rúben Dias RULED OUT — Martínez confirmed at his presser \"he is not fit for the game\" (hamstring picked up in the Nigeria friendly). Portugal's best CB and captain; a real hit to defensive/clean-sheet stability (Inácio / António Silva step in).",
    impactDirection: "negative", deltaDefense: -10, confidence: 0.9,
    sourceName: "Daily Post (Martínez presser)", sourceUrl: "https://dailypost.ng/2026/06/17/world-cup-2026-hes-not-fit-martinez-confirms-portugal-player-to-miss-dr-congo-clash/",
    publishedAt: "2026-06-17", expiresAfterMatch: true,
  },
  {
    matchId: "portugal-vs-dr-congo", team: "portugal", opponent: "dr-congo",
    type: "lineup", status: "confirmed",
    summary: "Ronaldo available and starting (his suspended qualifying ban does not apply) — attack unaffected; only the Dias absence moves the model.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.85,
    sourceName: "FotMob", sourceUrl: "https://www.fotmob.com/news/1x3dimabjly7w1r9aqei33nq4u-ronaldo-available-portugals-world-cup-opener-after-suspended-ban",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "portugal-vs-dr-congo", team: "dr-congo", opponent: "portugal",
    type: "tactical", status: "opinion",
    summary: "Physical, Premier-League-quality spine (Wan-Bissaka, Mbemba, Wissa, Bongonda) built to sit deep and break fast — the Cape-Verde-vs-Spain caution against auto-blowouts. Narrative only; style already in the tactical layer.",
    impactDirection: "positive", deltaElo: 0, confidence: 0.4,
    sourceName: "Al Jazeera", sourceUrl: "https://www.aljazeera.com/sports/2026/6/16/ronaldos-last-dance-as-portugal-face-dr-congo-in-world-cup",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 17 Jun · England vs Croatia (Group L) ───────────────────────────────
  {
    matchId: "england-vs-croatia", team: "england", opponent: "croatia",
    type: "availability", status: "opinion",
    summary: "Tino Livramento is OUT for the whole tournament (calf), Chalobah called up — so England's full-back DEPTH is thinned. The model hit is carried in the squad-availability layer (applies to every England game); here it is the depth/variance context, not a fresh per-match delta.",
    impactDirection: "negative", confidence: 0.5,
    sourceName: "Goal / Reuters", sourceUrl: "https://www.goal.com/en-us/lists/england-star-ruled-out-of-2026-world-cup-on-eve-of-croatia-opener-in-huge-injury-blow-for-thomas-tuchel/blt21765740b9f469bb",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "england-vs-croatia", team: "england", opponent: "croatia",
    type: "availability", status: "rumor",
    summary: "Saka playing down an Achilles concern and Tuchel may manage him; with Livramento gone the back-up cover is thinner. Unconfirmed — confidence only, no probability change.",
    impactDirection: "negative", confidence: 0.4,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/england/world-cup-2026/news/england-vs-croatia-injury-suspension-list-predicted-xis_599301.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "england-vs-croatia", team: "croatia", opponent: "england",
    type: "tactical", status: "opinion",
    summary: "Tournament experience + tempo control should raise draw resistance and slow the game; an ageing midfield limits their own ceiling. Narrative only.",
    impactDirection: "positive", deltaElo: 0, confidence: 0.4,
    sourceName: "RotoWire", sourceUrl: "https://www.rotowire.com/soccer/article/england-vs-croatia-preview-predicted-lineups-team-news-tactical-analysis-2026-world-cup-group-l-118361",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 17 Jun · Ghana vs Panama (Group L) ──────────────────────────────────
  {
    matchId: "ghana-vs-panama", team: "ghana", opponent: "panama",
    type: "availability", status: "confirmed",
    summary: "Thomas Partey DENIED ENTRY to Canada by the host government — misses THIS Toronto match only; available for Ghana's later games in the USA. Midfield anchor gone for the opener. (Kudus & Salisu are out for the whole tournament — see the squad layer.)",
    impactDirection: "negative", deltaElo: -8, confidence: 0.95,
    sourceName: "ESPN", sourceUrl: "https://www.espn.com/espn/story/_/id/49048302/ghana-vs-panama-kick-team-news-how-watch-black-stars-fifa-world-cup-opener",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "ghana-vs-panama", team: "panama", opponent: "ghana",
    type: "tactical", status: "opinion",
    summary: "Organised, physical, disciplined — a side built to frustrate; raises upset/draw resistance against a Ghana shorn of its creators. Narrative only.",
    impactDirection: "positive", deltaElo: 0, confidence: 0.4,
    sourceName: "Squawka", sourceUrl: "https://www.squawka.com/en/news/world-cup/ghana-vs-panama-team-news-predicted-lineups/",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 17 Jun · Uzbekistan vs Colombia (Group K) ───────────────────────────
  {
    matchId: "uzbekistan-vs-colombia", team: "colombia", opponent: "uzbekistan",
    type: "lineup", status: "confirmed",
    summary: "Clean bill of health — Luis Díaz and James Rodríguez both fit (James's minor knock resolved). Full first-choice attack available.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.8,
    sourceName: "ESPN", sourceUrl: "https://www.espn.com/soccer/story/_/id/48873914/james-rodriguez-luis-diaz-colombia-world-cup-squad",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "uzbekistan-vs-colombia", team: "uzbekistan", opponent: "colombia",
    type: "motivation", status: "opinion",
    summary: "World Cup debut: an inexperience penalty roughly offset by an emotional high. Structured 3-4-3 around Man City's Khusanov. Net ~neutral — narrative only.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.3,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/uzbekistan/world-cup-2026/preview/uzbekistan-vs-colombia-prediction-team-news-lineups_599296.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 18 Jun · Czechia vs South Africa (Group A, matchday 2) ──────────────
  // NB: Zwane's ban is a 3-match suspension (multi-game), so it lives in the
  // squad-availability layer (applies to all SA group games), not here. Only the
  // single-match Sithole ban is match-specific.
  {
    matchId: "czech-republic-vs-south-africa", team: "south-africa", opponent: "czech-republic",
    type: "availability", status: "confirmed",
    summary: "Sphephelo Sithole suspended — FIFA-confirmed one-match ban (second SA red card vs Mexico). A further midfield reshuffle on top of Zwane's longer ban.",
    impactDirection: "negative", deltaElo: -4, confidence: 0.95,
    sourceName: "AfricaSoccer (FIFA confirmed)", sourceUrl: "https://africasoccer.com/world-cup-2026-zwane-and-sithole-ruled-out-for-czech-clash-as-fifa-confirms-one-match-bans-after-mexico-red-cards/",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "czech-republic-vs-south-africa", team: "czech-republic", opponent: "south-africa",
    type: "motivation", status: "opinion",
    summary: "No fresh injuries; must-win after the Korea loss, so more attacking intent — but that also raises counter-attack exposure. Narrative only.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.4,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/czech-republic/world-cup-2026/preview/czech-republic-vs-south-africaprediction-team-news-lineups_599402.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 18 Jun · Switzerland vs Bosnia & Herzegovina (Group B, matchday 2) ──
  {
    matchId: "switzerland-vs-bosnia-and-herzegovina", team: "switzerland", opponent: "bosnia-and-herzegovina",
    type: "lineup", status: "confirmed",
    summary: "No injuries from the Qatar draw; stable, tournament-experienced core (Kobel, Akanji, Elvedi, Xhaka, Embolo) unchanged.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.8,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/switzerland/world-cup-2026/preview/switzerland-vs-bosnia-hvina-prediction-team-news-lineups_599327.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "switzerland-vs-bosnia-and-herzegovina", team: "bosnia-and-herzegovina", opponent: "switzerland",
    type: "availability", status: "rumor",
    summary: "Kolašinac limped off late vs Canada and is a defensive doubt — unconfirmed, confidence only.",
    impactDirection: "negative", confidence: 0.4,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/bosnia-herzegovina/world-cup-2026/predicted-lineups/kolasinac-to-miss-out-predicted-bosnia-herzegovina-xi-vs-switzerland_599385.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "switzerland-vs-bosnia-and-herzegovina", team: "bosnia-and-herzegovina", opponent: "switzerland",
    type: "tactical", status: "opinion",
    summary: "Resilient and hard to beat but blunt up front (Džeko benched, Demirović/Lukić lead the line) — lift their draw/unbeaten chance, not their win chance. Narrative only.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.4,
    sourceName: "Goal", sourceUrl: "https://www.goal.com/en/news/switzerland-bosnia-herzegovina-world-cup-preview/bltb96d9176142a8fe0",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 18 Jun · Canada vs Qatar (Group B, matchday 2) ──────────────────────
  {
    matchId: "canada-vs-qatar", team: "canada", opponent: "qatar",
    type: "availability", status: "confirmed",
    summary: "Alphonso Davies now EXPECTED TO FEATURE vs Qatar (updated read — treated as available). Modelled at ~85% available, so only a small residual of his full-out impact is applied for return-from-injury sharpness (hamstring, 6 May) — he is Canada's best attacker / left-side transition engine. Match-specific.",
    impactDirection: "negative", deltaAttack: -12, availabilityProb: 0.85, confidence: 0.6,
    sourceName: "ESPN / CBC (15 Jun) + updated availability read", sourceUrl: "https://www.espn.com/soccer/story/_/id/49076456/alphonso-davies-injury-canada-world-cup-qatar",
    publishedAt: "2026-06-18", expiresAfterMatch: true,
  },
  {
    matchId: "canada-vs-qatar", team: "qatar", opponent: "canada",
    type: "tactical", status: "opinion",
    summary: "Held Switzerland 1-1 with a deep block + counter and will likely repeat it; against a Davies-less Canada with limited block-breaking, this lifts the draw tail. Narrative only.",
    impactDirection: "positive", deltaElo: 0, confidence: 0.45,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/switzerland/world-cup-2026/preview/switzerland-vs-bosnia-hvina-prediction-team-news-lineups_599327.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 18 Jun · Mexico vs South Korea (Group A, matchday 2) ────────────────
  {
    matchId: "mexico-vs-south-korea", team: "mexico", opponent: "south-korea",
    type: "availability", status: "confirmed",
    summary: "César Montes suspended — red card (DOGSO) vs South Africa means he sits out the Korea game; Edson Álvarez drops into central defence to cover, reshuffling the spine — a small structural cost. Host advantage retained.",
    impactDirection: "negative", deltaDefense: -4, confidence: 0.9,
    sourceName: "HITC / CBS Sports", sourceUrl: "https://www.hitc.com/world-cup-suspension-rules-as-mexico-vs-south-africa-sees-three-red-cards/",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "mexico-vs-south-korea", team: "south-korea", opponent: "mexico",
    type: "lineup", status: "confirmed",
    summary: "Son Heung-min fit and starting; no injuries of note (Kim Tae-Hyeon a minor doubt). No sourced dressing-room/media controversy, so NO chemistry penalty is applied.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.8,
    sourceName: "ESPN", sourceUrl: "https://www.espn.com/soccer/story/_/id/49079638/mexico-vs-south-korea-fifa-world-cup-2026-tv-channel-how-watch-kick-live-stream-injury-predicted-line-ups",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },
  {
    matchId: "mexico-vs-south-korea", team: "south-korea", opponent: "mexico",
    type: "tactical", status: "opinion",
    summary: "Set up to counter: Korea's transition speed (Son, Lee Kang-in) can punish Mexico pushing high at home. Narrative only — style sits in the tactical layer.",
    impactDirection: "positive", deltaElo: 0, confidence: 0.4,
    sourceName: "Sports Mole", sourceUrl: "https://www.sportsmole.co.uk/football/south-korea/world-cup-2026/predicted-lineups/who-supports-son-up-top-in-world-cup-clash-predicted-south-korea-xi-vs-mexico_599403.html",
    publishedAt: "2026-06-16", expiresAfterMatch: true,
  },

  // ── 18 Jul · France vs England (third-place playoff, Miami) ─────────────
  {
    matchId: "france-vs-england", team: "france", opponent: "england",
    type: "motivation", status: "opinion",
    summary: "Bronze-final motivation is the whole story: Deschamps says France \"will do everything we can\" for a third straight top-3 finish, but semi-final losers routinely rotate heavily here. A rotation/motivation read, not a confirmed team change — narrative + uncertainty only.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.5,
    sourceName: "Al Jazeera (third-place preview)", sourceUrl: "https://www.aljazeera.com/sports/2026/7/16/world-cup-why-is-there-a-third-place-playoff-between-france-and-england",
    publishedAt: "2026-07-16", expiresAfterMatch: true,
  },
  {
    matchId: "france-vs-england", team: "england", opponent: "france",
    type: "motivation", status: "opinion",
    summary: "Tuchel was blunt after the semi: \"Nobody of [our] players, nobody of the French players wants to play for this match.\" England still chase their best finish since 1966, but expect changes on both sides — a rumour-grade rotation read that widens uncertainty, moves no probability.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.5,
    sourceName: "Al Jazeera (third-place preview)", sourceUrl: "https://www.aljazeera.com/sports/2026/7/16/world-cup-why-is-there-a-third-place-playoff-between-france-and-england",
    publishedAt: "2026-07-16", expiresAfterMatch: true,
  },

  // ── 19 Jul · Spain vs Argentina (FINAL, East Rutherford) ────────────────
  // NOTE: the Williams/Pino RECOVERIES are tournament-phase availability moves
  // and were applied in availabilityAdjustments.ts (fractionOut 1 → 0.25) per
  // rule 4 — the entries below are the fixture-boxed presser/lineup reads with
  // delta 0, so the recoveries are never double-counted.
  {
    matchId: "spain-vs-argentina", team: "spain", opponent: "argentina",
    type: "availability", status: "confirmed",
    summary: "No new injury concerns for the final — Nico Williams is back in the fray (fit, though short of full match sharpness) and Yeremy Pino has returned to full training after the shoulder scare proved less serious than feared. Both recoveries are already priced in the base model via the availability layer; delta 0 here.",
    impactDirection: "positive", deltaElo: 0, confidence: 0.85,
    sourceName: "Forbes (Spain final preview)", sourceUrl: "https://www.forbes.com/sites/samleveridge/2026/07/16/spain-world-cup-final-preview-journey-team-news-predicted-lineup/",
    publishedAt: "2026-07-16", expiresAfterMatch: true,
  },
  {
    matchId: "spain-vs-argentina", team: "argentina", opponent: "spain",
    type: "availability", status: "confirmed",
    summary: "Clean bill of health for the holders: Cristian Romero recovered from the cramps that followed the Switzerland quarter-final, played the full semi, and is in the squad for the final. No suspensions flagged on the list (single yellows are historically wiped after the quarter-finals). Confirmation only; delta 0.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.85,
    sourceName: "Sports Mole (Argentina injury/suspension list)", sourceUrl: "https://www.sportsmole.co.uk/football/argentina/world-cup-2026/injuries-and-suspensions/romero-paredes-latest-argentina-injury-suspension-list-for-world-cup-final_601316.html",
    publishedAt: "2026-07-16", expiresAfterMatch: true,
  },
  {
    matchId: "spain-vs-argentina", team: "argentina", opponent: "spain",
    type: "lineup", status: "rumor",
    summary: "Scaloni tipped for two changes from the England semi: Rodrigo De Paul restored to the midfield alongside Mac Allister and Enzo Fernández (Paredes holding), and 2022 shootout hero Gonzalo Montiel pushing Molina at right-back — with Lautaro Martínez again the super-sub behind the Messi–Álvarez pairing. Predicted XI, not confirmed — narrative + uncertainty only.",
    impactDirection: "neutral", deltaElo: 0, confidence: 0.55,
    sourceName: "Sports Mole (predicted Argentina XI)", sourceUrl: "https://www.sportsmole.co.uk/football/argentina/world-cup-2026/predicted-lineups/alvarez-or-martinez-de-paul-or-simeone-predicted-argentina-xi-vs-spain_601305.html",
    publishedAt: "2026-07-16", expiresAfterMatch: true,
  },
];

/**
 * Elo-equivalent impact of a single entry (negative = weaker). For a doubtful
 * player the full-out delta is scaled by the chance he is actually missing
 * (1 − availabilityProb), so a "questionable" tag never applies a full withdrawal.
 */
export function intelEloImpact(e: PreMatchIntel): number {
  const raw = (e.deltaElo ?? 0) + (e.deltaAttack ?? 0) + (e.deltaDefense ?? 0);
  const probOut = 1 - (e.availabilityProb ?? 0);
  return raw * probOut;
}

function fixtureMatch(e: PreMatchIntel, a: string, b: string): boolean {
  return (e.team === a && e.opponent === b) || (e.team === b && e.opponent === a);
}

/** All intel on file for a fixture (both teams), newest first. */
export function getFixtureIntel(a: string, b: string): PreMatchIntel[] {
  return PRE_MATCH_INTEL.filter((e) => fixtureMatch(e, a, b)).sort((x, y) =>
    x.publishedAt < y.publishedAt ? 1 : x.publishedAt > y.publishedAt ? -1 : 0
  );
}

/**
 * CONFIRMED-only, capped Elo delta for `team` against `opponent`. This is the
 * ONLY thing the layer feeds into the goal model.
 */
export function getIntelDelta(team: string, opponent: string): number {
  const raw = PRE_MATCH_INTEL.filter(
    (e) => e.status === "confirmed" && e.team === team && e.opponent === opponent
  ).reduce((s, e) => s + intelEloImpact(e), 0);
  return Math.max(-INTEL_CAP, Math.min(INTEL_CAP, Math.round(raw)));
}

/** Confirmed intel items that actually move the model, for `team` vs `opponent`. */
export function getConfirmedIntel(team: string, opponent: string): PreMatchIntel[] {
  return PRE_MATCH_INTEL.filter(
    (e) => e.status === "confirmed" && e.team === team && e.opponent === opponent && intelEloImpact(e) !== 0
  );
}

/**
 * Confidence multiplier (≤1) from the rumours/opinions around a fixture. These
 * NEVER move a probability — they only widen our uncertainty, so a noisy fixture
 * reports a slightly lower confidence score. Floored so it stays sensible.
 */
export function getIntelUncertainty(a: string, b: string): number {
  const soft = PRE_MATCH_INTEL.filter(
    (e) => fixtureMatch(e, a, b) && (e.status === "rumor" || e.status === "opinion")
  ).length;
  return Math.max(0.85, 1 - 0.03 * soft);
}

/** Metadata for transparent UI labelling. */
export function preMatchIntelligenceMeta(): {
  entries: number;
  confirmed: number;
  rumorOrOpinion: number;
  fixtures: number;
} {
  const confirmed = PRE_MATCH_INTEL.filter((e) => e.status === "confirmed").length;
  return {
    entries: PRE_MATCH_INTEL.length,
    confirmed,
    rumorOrOpinion: PRE_MATCH_INTEL.length - confirmed,
    fixtures: new Set(PRE_MATCH_INTEL.map((e) => e.matchId)).size,
  };
}

/** Short team name for narratives (safe). */
export function intelTeamName(slug: string): string {
  try {
    return getTeam(slug).name;
  } catch {
    return slug;
  }
}
