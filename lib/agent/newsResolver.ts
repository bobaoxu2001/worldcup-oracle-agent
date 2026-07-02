/**
 * Daily News Resolver — the agent's "what's happened lately?" step.
 *
 * Loads recent team news for the teams in a matchup (from the team_news store,
 * seeding curated demo signals if the store is empty) and shapes it into the
 * view the UI and the impact analyzer consume. Pure data-gathering — it does
 * not change any probabilities (that's the Injury/Squad Impact Analyzer).
 *
 * MODELLED SIGNALS (added 2 Jul): the manually-curated, sourced layers that
 * already move the BASE model — squad availability (availabilityAdjustments)
 * and fixture pre-match intel (preMatchIntelligence) — are surfaced here as
 * news items tagged `modelled: true`. Before this, a team with no live-API
 * coverage (e.g. Austria, whose English-language recall is poor) showed
 * "No significant recent news" even while confirmed injuries were moving the
 * prediction — the opposite of transparent. The impact analyzer SKIPS
 * modelled items so nothing is double-counted.
 */

import { getNewsForTeam } from "@/lib/news/newsIngestor";
import {
  AVAILABILITY_ADJUSTMENTS,
  entryDelta,
  type AvailabilityAdjustment,
} from "@/lib/prediction-engine/availabilityAdjustments";
import {
  getFixtureIntel,
  intelEloImpact,
  type PreMatchIntel,
} from "@/lib/prediction-engine/preMatchIntelligence";
import type { NewsCategory, NewsImpact, NewsSource, TeamNewsItem } from "@/lib/news/types";
import type { NewsItemView, TeamRef } from "./types";

/** Availability entries newer than this many days are shown as squad news. */
const AVAILABILITY_NEWS_WINDOW_DAYS = 14;

function impactFromElo(absElo: number): NewsImpact {
  return absElo >= 8 ? "high" : absElo >= 3 ? "medium" : "low";
}

/** A recent availability entry (already in the base model) as a news item. */
function availabilityToNews(a: AvailabilityAdjustment): TeamNewsItem {
  const d = entryDelta(a);
  const when = new Date(`${a.date}T12:00:00Z`);
  return {
    team: a.team,
    title: `${a.player} — ${a.reason}`,
    summary: `Confirmed squad-availability signal already priced into the base model (${d} Elo, capped). Source: ${a.source}.`,
    category: "injury",
    impactLevel: impactFromElo(Math.abs(d)),
    affectedPlayers: [a.player],
    sourceName: a.source,
    sourceUrl: "",
    publishedAt: when,
    createdAt: when,
    direction: d < 0 ? "negative" : "neutral",
    demo: false,
    modelled: true,
  };
}

const INTEL_CATEGORY: Record<PreMatchIntel["type"], NewsCategory> = {
  availability: "injury",
  lineup: "squad",
  motivation: "form",
  tactical: "tactics",
  coach: "coach",
  warmup_reliability: "form",
  media_noise: "other",
};

/** A fixture pre-match intel item (confirmed → in model; else narrative). */
function intelToNews(e: PreMatchIntel): TeamNewsItem {
  const d = e.status === "confirmed" ? intelEloImpact(e) : 0;
  const when = new Date(`${e.publishedAt}T12:00:00Z`);
  return {
    team: e.team,
    title: e.summary.split("—")[0].trim().slice(0, 120) || e.summary.slice(0, 120),
    summary: e.summary,
    category: INTEL_CATEGORY[e.type],
    impactLevel: e.status === "confirmed" ? impactFromElo(Math.abs(d)) : "low",
    affectedPlayers: [],
    sourceName: `${e.sourceName}${e.status !== "confirmed" ? ` · ${e.status}` : ""}`,
    sourceUrl: e.sourceUrl,
    publishedAt: when,
    createdAt: when,
    direction: e.impactDirection,
    demo: false,
    modelled: true,
  };
}

/** Recent availability entries for a team, newest first. */
function recentAvailabilityNews(teamSlug: string): TeamNewsItem[] {
  const cutoff = Date.now() - AVAILABILITY_NEWS_WINDOW_DAYS * 86_400_000;
  return AVAILABILITY_ADJUSTMENTS.filter(
    (a) => a.team === teamSlug && new Date(`${a.date}T12:00:00Z`).getTime() >= cutoff
  )
    .map(availabilityToNews)
    .sort((x, y) => +y.publishedAt - +x.publishedAt);
}

/** All modelled signals for one side of a fixture (intel + recent availability). */
function modelledNews(teamSlug: string, opponentSlug?: string): TeamNewsItem[] {
  const intel = opponentSlug
    ? getFixtureIntel(teamSlug, opponentSlug)
        .filter((e) => e.team === teamSlug)
        .map(intelToNews)
    : [];
  return [...intel, ...recentAvailabilityNews(teamSlug)];
}

export interface ResolvedTeamNews {
  team: TeamRef;
  items: TeamNewsItem[];
  views: NewsItemView[];
}

export interface ResolvedNews {
  teamA: ResolvedTeamNews;
  teamB: ResolvedTeamNews;
  /** 'api' if any live items were involved, else 'demo'. */
  source: NewsSource;
}

function toView(it: TeamNewsItem): NewsItemView {
  return {
    title: it.title,
    summary: it.summary,
    category: it.category,
    impactLevel: it.impactLevel,
    direction: it.direction,
    sourceName: it.sourceName,
    sourceUrl: it.sourceUrl,
    publishedAt: new Date(it.publishedAt).toISOString(),
    demo: it.demo,
    modelled: it.modelled,
  };
}

/** Resolve recent news for a single team into the agent's view shape. */
export async function resolveTeamNews(
  team: TeamRef,
  perTeam = 6
): Promise<{ resolved: ResolvedTeamNews; source: NewsSource }> {
  const r = await getNewsForTeam(team.slug, perTeam);
  const items = [...modelledNews(team.slug), ...r.items];
  return {
    resolved: { team, items, views: items.map(toView) },
    source: r.source,
  };
}

export async function resolveNews(
  teamA: TeamRef,
  teamB: TeamRef,
  perTeam = 4
): Promise<ResolvedNews> {
  const [a, b] = await Promise.all([
    getNewsForTeam(teamA.slug, perTeam),
    getNewsForTeam(teamB.slug, perTeam),
  ]);

  const source: NewsSource = a.source === "api" || b.source === "api" ? "api" : "demo";

  // Modelled (in-base-model) signals lead each column so a confirmed injury is
  // never invisible just because the live search missed the team.
  const itemsA = [...modelledNews(teamA.slug, teamB.slug), ...a.items];
  const itemsB = [...modelledNews(teamB.slug, teamA.slug), ...b.items];

  return {
    teamA: { team: teamA, items: itemsA, views: itemsA.map(toView) },
    teamB: { team: teamB, items: itemsB, views: itemsB.map(toView) },
    source,
  };
}
