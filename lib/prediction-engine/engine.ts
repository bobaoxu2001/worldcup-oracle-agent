/**
 * Prediction engine — public API.
 *
 * Ported Elo + Dixon-Coles + Monte Carlo model behind clean, app-facing
 * functions:
 *   - predictMatch(teamA, teamB)        single-match 1X2 + derived metrics
 *   - simulateGroup(group)              group standings probabilities
 *   - simulateTournament()              full 48-team Monte Carlo
 *   - getChampionProbabilities()        title odds table
 *   - generateMatchExplanation(pred)    human-readable model write-up
 *
 * Match probabilities are deterministic (closed-form Dixon-Coles).
 * Tournament odds use seeded Monte Carlo, memoised so they are stable
 * across requests.
 *
 * Original source: Hicruben/world-cup-2026-prediction-model, ported to TS.
 * This is the statistical core the WorldCup Oracle Agent reasons over.
 */

import { matchProb, sampleMatch, scorelineGrid, mulberry32, K_FACTOR_WC } from "./elo";
import { getRating, HOME_ADVANTAGE } from "./ratings";
import { getUpdatedRating, getResultDelta, ratingUpdatesMeta } from "./ratingUpdates";
import {
  getEffectiveRating,
  getAvailabilityDelta,
  getAvailabilityAdjustments,
} from "./availabilityAdjustments";
import { getConfederationDelta } from "./confederationForm";
import { getTacticalMatchup } from "./tacticalMatchups";
import { applyDrawPropensity } from "./drawPropensity";
import {
  GROUPS,
  HOST_SLUGS,
  getTeam,
  getGroup,
  type SeedGroup,
} from "@/lib/seed/world-cup-2026-groups";
import {
  BRACKET_2026,
  REACH_BUCKET,
  assignThirdPlaceSlots,
  resolvePosition,
  type GroupLetter,
  type RankedTeam,
} from "./bracket-2026";
import type {
  MatchPrediction,
  ModelFactor,
  ConfidenceLevel,
  UpsetRisk,
  ChampionOdds,
  GroupSimRow,
} from "@/lib/types";

const SIM_SEED = 20260611; // fixed seed → reproducible tournament odds
const TOURNAMENT_SIMS = 10000;

/** Home-field bonus for a fixture: hosts get +adv, their opponents −adv. */
function homeBonus(teamA: string, teamB: string): number {
  if (HOST_SLUGS.has(teamA) && !HOST_SLUGS.has(teamB)) return HOME_ADVANTAGE;
  if (HOST_SLUGS.has(teamB) && !HOST_SLUGS.has(teamA)) return -HOME_ADVANTAGE;
  return 0;
}

/**
 * The ratings the goal model uses for a SPECIFIC fixture: each side's standalone
 * effective rating PLUS the per-fixture tactical style-clash nudge (which is
 * opponent-dependent and therefore cannot live in getEffectiveRating). Used by
 * predictMatch and every Monte Carlo match sample so group/title odds reflect it.
 */
function matchupRatings(aSlug: string, bSlug: string): { eloA: number; eloB: number } {
  const tac = getTacticalMatchup(aSlug, bSlug);
  return {
    eloA: getEffectiveRating(aSlug) + tac.a,
    eloB: getEffectiveRating(bSlug) + tac.b,
  };
}

function confidenceFrom(topProb: number): {
  level: ConfidenceLevel;
  score: number;
} {
  const score = Math.round(topProb * 100);
  let level: ConfidenceLevel;
  if (score >= 62) level = "Very High";
  else if (score >= 50) level = "High";
  else if (score >= 40) level = "Moderate";
  else level = "Low";
  return { level, score };
}

function upsetFrom(winA: number, winB: number): UpsetRisk {
  const underdogWin = Math.min(winA, winB);
  if (underdogWin >= 0.3) return "High";
  if (underdogWin >= 0.2) return "Elevated";
  return "Low";
}

function buildFactors(
  aSlug: string,
  bSlug: string,
  eloA: number,
  eloB: number,
  hb: number,
  p: ReturnType<typeof matchProb>
): ModelFactor[] {
  const a = getTeam(aSlug);
  const b = getTeam(bSlug);
  const gap = Math.round(eloA - eloB);
  const factors: ModelFactor[] = [];

  factors.push({
    label: "Elo strength gap",
    detail:
      gap === 0
        ? `Dead level on the model's Elo scale (${eloA} vs ${eloB}).`
        : `${gap > 0 ? a.name : b.name} rates ${Math.abs(gap)} Elo points higher (${eloA} vs ${eloB}).`,
    weight: Math.abs(gap) >= 120 ? "high" : Math.abs(gap) >= 50 ? "medium" : "low",
  });

  if (hb !== 0) {
    const host = hb > 0 ? a.name : b.name;
    factors.push({
      label: "Host advantage",
      detail: `${host} carries a +${HOME_ADVANTAGE} home-field Elo bonus as a 2026 host nation.`,
      weight: "medium",
    });
  }

  const dA = getResultDelta(aSlug);
  const dB = getResultDelta(bSlug);
  if (dA !== 0 || dB !== 0) {
    const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
    const { resultsUsed } = ratingUpdatesMeta();
    factors.push({
      label: "Live Elo update",
      detail: `Ratings adjusted from ${resultsUsed} completed result${resultsUsed === 1 ? "" : "s"} (K=${K_FACTOR_WC} Elo update): ${a.name} ${fmt(dA)}, ${b.name} ${fmt(dB)} on top of the May 2026 calibration.`,
      weight: "low",
    });
  }

  const availA = getAvailabilityDelta(aSlug);
  const availB = getAvailabilityDelta(bSlug);
  if (availA !== 0 || availB !== 0) {
    const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
    const names = (slug: string) =>
      getAvailabilityAdjustments(slug)
        .map((x) => x.player)
        .join(", ");
    const parts: string[] = [];
    if (availA !== 0) parts.push(`${a.name} ${fmt(availA)} (${names(aSlug)})`);
    if (availB !== 0) parts.push(`${b.name} ${fmt(availB)} (${names(bSlug)})`);
    factors.push({
      label: "Squad availability",
      detail: `Capped Elo adjustment for confirmed injuries / withdrawals — ${parts.join("; ")}. A transparent, manually-sourced squad-news signal, not a precise medical model.`,
      weight: Math.max(Math.abs(availA), Math.abs(availB)) >= 25 ? "medium" : "low",
    });
  }

  const formA = getConfederationDelta(aSlug);
  const formB = getConfederationDelta(bSlug);
  if (formA !== 0 || formB !== 0) {
    const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
    const parts: string[] = [];
    if (formA !== 0) parts.push(`${a.name} (${getTeam(aSlug).confederation}) ${fmt(formA)}`);
    if (formB !== 0) parts.push(`${b.name} (${getTeam(bSlug).confederation}) ${fmt(formB)}`);
    factors.push({
      label: "Confederation form",
      detail: `Capped, shrunk Elo nudge from how each side's confederation has performed vs expectation so far this tournament — ${parts.join("; ")}. A speculative tournament-form prior on a small sample, not a calibrated finding.`,
      weight: Math.max(Math.abs(formA), Math.abs(formB)) >= 15 ? "medium" : "low",
    });
  }

  const tac = getTacticalMatchup(aSlug, bSlug);
  if (tac.active) {
    const mag = Math.max(Math.abs(tac.a), Math.abs(tac.b));
    factors.push({
      label: "Tactical matchup (playstyle)",
      detail: `Style clash, not just strength: ${tac.summary} A capped, scouting-style prior — a disciplined low block can frustrate a side that dominates the ball but lacks a clean way through it.`,
      weight: mag >= 20 ? "high" : mag >= 10 ? "medium" : "low",
    });
  }

  factors.push({
    label: "Expected goals (Dixon-Coles)",
    detail: `Model projects ${p.expectedGoalsA.toFixed(2)} xG for ${a.name} and ${p.expectedGoalsB.toFixed(2)} for ${b.name}, with a low-score draw correction (ρ = −0.13).`,
    weight: "medium",
  });

  const dp = applyDrawPropensity(p, aSlug, bSlug);
  if (dp.applied) {
    factors.push({
      label: "Group-stage draw propensity",
      detail: `World Cup group openers draw far more often than raw Elo implies (the 11–15 June openers drew 50%, vs a ~23% model baseline). The draw is nudged +${Math.round(dp.boost * 100)} pts (to ${Math.round(dp.draw * 100)}%) for this group fixture, with both win probabilities shrunk proportionally — the favourite is unchanged. A small, capped correction toward the historical WC group draw rate, strongest for matchday-1 openers.`,
      weight: dp.boost >= 0.05 ? "medium" : "low",
    });
  }

  const drawPct = Math.round(dp.draw * 100);
  factors.push({
    label: "Draw likelihood",
    detail: `Model puts the draw at ${drawPct}% — ${drawPct >= 26 ? "elevated, this projects as a tight, low-margin game" : "moderate, one side is expected to take control"}.`,
    weight: drawPct >= 28 ? "medium" : "low",
  });

  return factors;
}

export function predictMatch(
  teamASlug: string,
  teamBSlug: string,
  matchId = `${teamASlug}-vs-${teamBSlug}`,
  options: { eloOverrideA?: number; eloOverrideB?: number } = {}
): MatchPrediction {
  const a = getTeam(teamASlug);
  const b = getTeam(teamBSlug);
  const baseEloA = getRating(teamASlug);
  const baseEloB = getRating(teamBSlug);
  // Completed-result deltas (base May-2026 calibration + K=60 result updates).
  const resultEloA = getUpdatedRating(teamASlug);
  const resultEloB = getUpdatedRating(teamBSlug);
  // Capped squad-availability signal (confirmed injuries / withdrawals).
  const availA = getAvailabilityDelta(teamASlug);
  const availB = getAvailabilityDelta(teamBSlug);
  // Capped confederation tournament-form signal (region over/under-performing).
  const formA = getConfederationDelta(teamASlug);
  const formB = getConfederationDelta(teamBSlug);
  // Per-fixture tactical style-clash nudge (opponent-dependent, zero-sum).
  const tac = getTacticalMatchup(teamASlug, teamBSlug);
  // Effective Elo the model simulates with = results + availability + form +
  // the fixture's tactical matchup.
  const eloA = resultEloA + availA + formA + tac.a;
  const eloB = resultEloB + availB + formB + tac.b;
  const hb = homeBonus(teamASlug, teamBSlug);

  // Optional Elo overrides power the agent's "what-if" scenario re-analysis
  // (e.g. a key player unavailable). Default behaviour is unchanged.
  const effEloA = options.eloOverrideA ?? eloA;
  const effEloB = options.eloOverrideB ?? eloB;

  const p = matchProb(effEloA, effEloB, hb);
  // Group-stage draw-propensity correction (openers draw more than raw Elo
  // says) — adds mass to the DRAW only, shrinking both wins proportionally so
  // the favourite is unchanged. No-op for non-group / cross-group fixtures.
  const dp = applyDrawPropensity(p, teamASlug, teamBSlug);
  const winA = dp.winA;
  const draw = dp.draw;
  const winB = dp.winB;
  const topProb = Math.max(winA, draw, winB);
  const { level, score } = confidenceFrom(topProb);
  const upsetRisk = upsetFrom(winA, winB);

  // Most-likely scoreline from the Dixon-Coles grid.
  const grid = scorelineGrid(effEloA, effEloB, hb);
  const sortedGrid = [...grid].sort((x, y) => y.p - x.p);
  const top = sortedGrid[0];
  const mostLikelyScoreline = `${top.a}–${top.b}`;
  const topScorelines = sortedGrid
    .slice(0, 6)
    .map((g) => ({ score: `${g.a}–${g.b}`, prob: g.p }));
  const expectedScore = `${p.expectedGoalsA.toFixed(1)} – ${p.expectedGoalsB.toFixed(1)}`;

  const factors = buildFactors(teamASlug, teamBSlug, eloA, eloB, hb, p);

  const favName =
    winA > winB ? a.name : winB > winA ? b.name : "Neither side";
  const favProb = Math.max(winA, winB);
  const modelSummary =
    favProb >= 0.5
      ? `${favName} favoured at ${(favProb * 100).toFixed(0)}% — ${level.toLowerCase()} model confidence.`
      : `Finely balanced — ${favName} a slight ${(favProb * 100).toFixed(0)}% favourite, ${(draw * 100).toFixed(0)}% draw.`;

  const prediction: MatchPrediction = {
    matchId,
    teamA: teamASlug,
    teamB: teamBSlug,
    teamAWinProbability: winA,
    drawProbability: draw,
    teamBWinProbability: winB,
    expectedGoalsA: p.expectedGoalsA,
    expectedGoalsB: p.expectedGoalsB,
    expectedScore,
    mostLikelyScoreline,
    confidenceLevel: level,
    confidenceScore: score,
    upsetRisk,
    eloA: effEloA,
    eloB: effEloB,
    eloBreakdown: {
      a: {
        base: baseEloA,
        completedResultsAdjustment: resultEloA - baseEloA,
        squadStabilityAdjustment: availA,
        verifiedNewsAdjustment: 0,
        tournamentFormAdjustment: formA,
        tacticalMatchupAdjustment: tac.a,
        adjusted: effEloA,
      },
      b: {
        base: baseEloB,
        completedResultsAdjustment: resultEloB - baseEloB,
        squadStabilityAdjustment: availB,
        verifiedNewsAdjustment: 0,
        tournamentFormAdjustment: formB,
        tacticalMatchupAdjustment: tac.b,
        adjusted: effEloB,
      },
    },
    topScorelines,
    factors,
    modelSummary,
    fullReport: "",
  };

  prediction.fullReport = generateMatchExplanation(prediction);
  return prediction;
}

/**
 * Human-readable, AI-style write-up of a match prediction. Deterministic prose
 * generated from the model's own outputs (no external LLM call required).
 */
export function generateMatchExplanation(pred: MatchPrediction): string {
  const a = getTeam(pred.teamA);
  const b = getTeam(pred.teamB);
  const pd = (pred.drawProbability * 100).toFixed(0);
  const fav = pred.teamAWinProbability >= pred.teamBWinProbability ? a : b;
  const dog = fav.slug === a.slug ? b : a;
  const favProb =
    fav.slug === a.slug ? pred.teamAWinProbability : pred.teamBWinProbability;
  const dogProb =
    dog.slug === a.slug ? pred.teamAWinProbability : pred.teamBWinProbability;

  const lines: string[] = [];

  lines.push(
    `The model makes ${fav.name} the favourite in this fixture, assigning a ${(favProb * 100).toFixed(0)}% win probability versus ${(dogProb * 100).toFixed(0)}% for ${dog.name}, with the draw at ${pd}%. These numbers come from each side's calibrated Elo rating (${a.name} ${pred.eloA}, ${b.name} ${pred.eloB}) fed through a Dixon-Coles bivariate Poisson goal model.`
  );

  lines.push(
    `Projected expected goals land at ${pred.expectedScore}, and the single most-likely scoreline is ${pred.mostLikelyScoreline}. The Dixon-Coles correction (ρ = −0.13) deliberately lifts the probability of low-scoring draws such as 0–0 and 1–1, which plain Poisson tends to undercount.`
  );

  if (pred.upsetRisk !== "Low") {
    lines.push(
      `Upset risk is flagged as ${pred.upsetRisk}: ${dog.name} still win outright in roughly ${(dogProb * 100).toFixed(0)}% of simulations, so this is not a fixture to treat as a foregone conclusion. Tournament football is high-variance, and a single goal swings tight matches like this one.`
    );
  } else {
    lines.push(
      `Upset risk is Low — ${dog.name} clear the model in only about ${(dogProb * 100).toFixed(0)}% of simulations. ${fav.name} would have to badly underperform their rating to drop points here.`
    );
  }

  lines.push(
    `Overall model confidence is ${pred.confidenceLevel} (${pred.confidenceScore}/100), driven by the ${Math.abs(pred.eloA - pred.eloB)}-point Elo gap${pred.factors.some((f) => f.label === "Host advantage") ? " and the host-nation home-field bonus" : ""}. Treat this as a well-calibrated probability estimate, not a guaranteed outcome.`
  );

  return lines.join("\n\n");
}

// ---------------------------------------------------------------------------
// Monte Carlo: group + full tournament
// ---------------------------------------------------------------------------

interface Standing {
  slug: string;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}

interface GroupMatch {
  a: string;
  b: string;
  ga: number;
  gb: number;
}

/**
 * Rank teams across DIFFERENT groups (used to pick the 8 best third-placed
 * teams). FIFA order: points → goal difference → goals scored → … → fair play
 * → drawing of lots. Head-to-head cannot apply across groups. Since a forward
 * Monte Carlo simulation has no fair-play/disciplinary data, we approximate the
 * final tiebreakers with team strength (Elo) and then a deterministic key, and
 * document that approximation in the README.
 */
function rankAcrossGroups(rows: Standing[]): Standing[] {
  return [...rows].sort(
    (x, y) =>
      y.points - x.points ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      getEffectiveRating(y.slug) - getEffectiveRating(x.slug) ||
      (x.slug < y.slug ? -1 : 1)
  );
}

/**
 * Rank teams WITHIN a single group with the official FIFA tiebreakers:
 *   1) points · 2) goal difference · 3) goals scored
 *   4) head-to-head among the still-tied teams: H2H points → H2H GD → H2H GF
 *   5) fair-play / drawing of lots  ← approximated by Elo + deterministic key
 *      (no disciplinary data exists in a forward simulation; documented).
 */
function rankWithinGroup(
  table: Record<string, Standing>,
  matches: GroupMatch[]
): Standing[] {
  const slugs = Object.keys(table);
  const samePGGF = (a: string, b: string) =>
    table[a].points === table[b].points &&
    table[a].gd === table[b].gd &&
    table[a].gf === table[b].gf;

  // Mini-table among a tied subset (head-to-head results only).
  const headToHead = (subset: string[]) => {
    const mt: Record<string, { p: number; gd: number; gf: number }> = {};
    for (const s of subset) mt[s] = { p: 0, gd: 0, gf: 0 };
    const inSet = new Set(subset);
    for (const m of matches) {
      if (!inSet.has(m.a) || !inSet.has(m.b)) continue;
      mt[m.a].gf += m.ga;
      mt[m.a].gd += m.ga - m.gb;
      mt[m.b].gf += m.gb;
      mt[m.b].gd += m.gb - m.ga;
      if (m.ga > m.gb) mt[m.a].p += 3;
      else if (m.gb > m.ga) mt[m.b].p += 3;
      else {
        mt[m.a].p += 1;
        mt[m.b].p += 1;
      }
    }
    return mt;
  };

  const base = slugs.sort(
    (x, y) =>
      table[y].points - table[x].points ||
      table[y].gd - table[x].gd ||
      table[y].gf - table[x].gf
  );

  const out: string[] = [];
  let i = 0;
  while (i < base.length) {
    let j = i + 1;
    while (j < base.length && samePGGF(base[i], base[j])) j++;
    const tied = base.slice(i, j);
    if (tied.length > 1) {
      const mt = headToHead(tied);
      tied.sort(
        (x, y) =>
          mt[y].p - mt[x].p ||
          mt[y].gd - mt[x].gd ||
          mt[y].gf - mt[x].gf ||
          getEffectiveRating(y) - getEffectiveRating(x) || // fair-play/lots approximation
          (x < y ? -1 : 1)
      );
    }
    out.push(...tied);
    i = j;
  }
  return out.map((slug) => table[slug]);
}

/** Play one group's 6 matches once, keeping per-match results for tiebreakers. */
function playGroupOnce(
  group: SeedGroup,
  rng: () => number
): { table: Record<string, Standing>; matches: GroupMatch[] } {
  const table: Record<string, Standing> = {};
  for (const slug of group.teams)
    table[slug] = { slug, points: 0, gf: 0, ga: 0, gd: 0 };

  const pairs: [number, number][] = [
    [0, 1],
    [2, 3],
    [0, 2],
    [3, 1],
    [3, 0],
    [1, 2],
  ];
  const matches: GroupMatch[] = [];
  for (const [i, j] of pairs) {
    const A = group.teams[i];
    const B = group.teams[j];
    const { eloA, eloB } = matchupRatings(A, B);
    const { goalsA, goalsB } = sampleMatch(
      eloA,
      eloB,
      homeBonus(A, B),
      true,
      rng
    );
    matches.push({ a: A, b: B, ga: goalsA, gb: goalsB });
    table[A].gf += goalsA;
    table[A].ga += goalsB;
    table[B].gf += goalsB;
    table[B].ga += goalsA;
    if (goalsA > goalsB) table[A].points += 3;
    else if (goalsB > goalsA) table[B].points += 3;
    else {
      table[A].points += 1;
      table[B].points += 1;
    }
  }
  for (const s of Object.values(table)) s.gd = s.gf - s.ga;
  return { table, matches };
}

/** Simulate one group's 6 matches once → standings ranked with full tiebreakers. */
function simulateGroupOnce(group: SeedGroup, rng: () => number): Standing[] {
  const { table, matches } = playGroupOnce(group, rng);
  return rankWithinGroup(table, matches);
}

/** Probabilistic group standings (win-group / advance / expected points). */
export function simulateGroup(groupName: string, sims = 20000): GroupSimRow[] {
  const group = getGroup(groupName);
  const rng = mulberry32(SIM_SEED ^ groupName.charCodeAt(0));
  const agg: Record<string, { first: number; top2: number; pts: number }> = {};
  for (const slug of group.teams) agg[slug] = { first: 0, top2: 0, pts: 0 };

  for (let s = 0; s < sims; s++) {
    const ranked = simulateGroupOnce(group, rng);
    agg[ranked[0].slug].first++;
    agg[ranked[0].slug].top2++;
    agg[ranked[1].slug].top2++;
    for (const r of ranked) agg[r.slug].pts += r.points;
  }

  return group.teams
    .map((slug) => {
      const t = getTeam(slug);
      return {
        slug,
        name: t.name,
        flag: t.flag,
        elo: getEffectiveRating(slug),
        winGroup: agg[slug].first / sims,
        advance: agg[slug].top2 / sims,
        expectedPoints: agg[slug].pts / sims,
      } satisfies GroupSimRow;
    })
    .sort((a, b) => b.advance - a.advance || b.winGroup - a.winGroup);
}

export const STAGE_KEYS = [
  "roundOf32",
  "roundOf16",
  "quarterFinal",
  "semiFinal",
  "final",
  "champion",
] as const;

export interface TournamentResult {
  champions: ChampionOdds[];
  groupRows: Record<string, GroupSimRow[]>;
  sims: number;
}

let _tournamentCache: TournamentResult | null = null;

/**
 * Full 48-team Monte Carlo following the OFFICIAL 2026 format:
 *
 *   1. Simulate all 12 groups (A–L), ranking each with FIFA tiebreakers.
 *   2. Qualify 12 winners + 12 runners-up + the 8 best third-placed teams = 32.
 *   3. Route the 32 into the OFFICIAL Round-of-32 bracket (matches 73–88),
 *      including FIFA Annex C best-third placement — NOT a generic seed order.
 *   4. Play the fixed knockout tree (R16 89–96 → QF → SF → Final 104).
 */
export function simulateTournament(sims = TOURNAMENT_SIMS): TournamentResult {
  if (_tournamentCache && _tournamentCache.sims === sims)
    return _tournamentCache;

  const rng = mulberry32(SIM_SEED);
  const reach: Record<string, number[]> = {};
  for (const t of GROUPS.flatMap((g) => g.teams))
    reach[t] = [0, 0, 0, 0, 0, 0];

  for (let s = 0; s < sims; s++) {
    // 1+2. Group stage → winners / runners-up / thirds (tagged by group letter).
    const groupResults: Record<GroupLetter, RankedTeam[]> = {} as Record<
      GroupLetter,
      RankedTeam[]
    >;
    const thirds: { letter: GroupLetter; standing: Standing }[] = [];

    for (const group of GROUPS) {
      const ranked = simulateGroupOnce(group, rng);
      const letter = group.name as GroupLetter;
      groupResults[letter] = ranked;
      thirds.push({ letter, standing: ranked[2] });
    }

    // 8 best third-placed teams (ranked across groups) → their group letters.
    const bestThirdGroups = rankAcrossGroups(thirds.map((t) => t.standing))
      .slice(0, 8)
      .map((st) => thirds.find((t) => t.standing.slug === st.slug)!.letter);

    // 3. Official Annex C assignment of thirds to R32 slots.
    const thirdAssignment = assignThirdPlaceSlots(bestThirdGroups);

    // 4. Play the official bracket in match-number order.
    const winners: Record<number, string> = {};
    const ctx = { groupResults, thirdAssignment, winners };
    for (const m of BRACKET_2026) {
      const home = resolvePosition(m.home, ctx);
      const away = resolvePosition(m.away, ctx);
      if (m.round === "R32") {
        // Both participants reached the Round of 32 (bucket 0).
        reach[home][0]++;
        reach[away][0]++;
      }
      const { eloA, eloB } = matchupRatings(home, away);
      const { goalsA, goalsB } = sampleMatch(
        eloA,
        eloB,
        homeBonus(home, away),
        false, // knockout — no draws
        rng
      );
      const winner = goalsA >= goalsB ? home : away;
      winners[m.no] = winner;
      reach[winner][REACH_BUCKET[m.round]]++;
    }
  }

  const champions: ChampionOdds[] = Object.keys(reach)
    .map((slug) => {
      const t = getTeam(slug);
      const r = reach[slug];
      return {
        slug,
        name: t.name,
        flag: t.flag,
        elo: getEffectiveRating(slug),
        roundOf32: r[0] / sims,
        roundOf16: r[1] / sims,
        quarterFinal: r[2] / sims,
        semiFinal: r[3] / sims,
        final: r[4] / sims,
        champion: r[5] / sims,
      } satisfies ChampionOdds;
    })
    .sort((a, b) => b.champion - a.champion || b.elo - a.elo);

  const groupRows: Record<string, GroupSimRow[]> = {};
  for (const g of GROUPS) groupRows[g.name] = simulateGroup(g.name);

  _tournamentCache = { champions, groupRows, sims };
  return _tournamentCache;
}

export function getChampionProbabilities(): ChampionOdds[] {
  return simulateTournament().champions;
}

export function getChampionOddsFor(slug: string): ChampionOdds | undefined {
  return simulateTournament().champions.find((c) => c.slug === slug);
}
