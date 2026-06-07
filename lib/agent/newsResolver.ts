/**
 * Daily News Resolver — the agent's "what's happened lately?" step.
 *
 * Loads recent team news for the teams in a matchup (from the team_news store,
 * seeding curated demo signals if the store is empty) and shapes it into the
 * view the UI and the impact analyzer consume. Pure data-gathering — it does
 * not change any probabilities (that's the Injury/Squad Impact Analyzer).
 */

import { getNewsForTeam } from "@/lib/news/newsIngestor";
import type { NewsSource, TeamNewsItem } from "@/lib/news/types";
import type { NewsItemView, TeamRef } from "./types";

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
  };
}

/** Resolve recent news for a single team into the agent's view shape. */
export async function resolveTeamNews(
  team: TeamRef,
  perTeam = 6
): Promise<{ resolved: ResolvedTeamNews; source: NewsSource }> {
  const r = await getNewsForTeam(team.slug, perTeam);
  return {
    resolved: { team, items: r.items, views: r.items.map(toView) },
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

  return {
    teamA: { team: teamA, items: a.items, views: a.items.map(toView) },
    teamB: { team: teamB, items: b.items, views: b.items.map(toView) },
    source,
  };
}
