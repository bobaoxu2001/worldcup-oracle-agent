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
 * Last updated: 2026-06-17 (today's Groups K/L + tomorrow's Groups A/B matchday-2).
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
    summary: "Alphonso Davies DOUBTFUL, not officially ruled out — back in boots but on return-to-play protocols and 'highly unlikely' for Qatar (hamstring, 6 May). Modelled PROBABILISTICALLY at ~25% available, so only ~75% of his full-out impact is applied (he is Canada's best attacker / left-side transition engine). Expected back for later games — match-specific.",
    impactDirection: "negative", deltaAttack: -12, availabilityProb: 0.25, confidence: 0.7,
    sourceName: "ESPN / CBC (15 Jun)", sourceUrl: "https://www.espn.com/soccer/story/_/id/49076456/alphonso-davies-injury-canada-world-cup-qatar",
    publishedAt: "2026-06-15", expiresAfterMatch: true,
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
