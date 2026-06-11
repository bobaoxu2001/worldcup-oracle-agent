/**
 * News Ingestor — the daily-refresh orchestrator.
 *
 *   for each tracked team:
 *     provider.fetchTeamNews()  (live API, if a key is configured)
 *       → classify each item (category / impact / direction)
 *       → else fall back to curated demo signals
 *     → store (MongoDB team_news, or in-memory)
 *
 * Also exposes getNewsForTeam(), which the agent uses at prediction time. If the
 * store is empty for a team (e.g. no refresh has run yet), it transparently
 * seeds curated demo signals so the agent ALWAYS has news context to reason over.
 */

import { getActiveProvider, newsProviderConfigured } from "./newsProvider";
import { classifyNews, isRelevantTeamNews } from "./newsClassifier";
import { saveTeamNews, getTeamNews, getNewsStats, getLastNewsUpdate, hasStoredNews } from "./teamNewsStore";
import { getDemoNews, TRACKED_TEAMS, hasDemoNews } from "./demoNews";
import type { NewsRefreshSummary, NewsSource, TeamNewsItem } from "./types";

/** Name of the active live news provider, or null in demo mode. */
export function activeNewsProviderName(): string | null {
  return getActiveProvider()?.name ?? null;
}

/** Current news mode for badges: live API vs curated demo signals. */
export function newsMode(): { mode: NewsSource; provider: string | null } {
  const provider = getActiveProvider();
  return provider ? { mode: "api", provider: provider.name } : { mode: "demo", provider: null };
}

/** Convert raw provider items → classified, stored-ready TeamNewsItems. */
async function fetchAndClassify(team: string, limit: number): Promise<TeamNewsItem[]> {
  const provider = getActiveProvider();
  if (!provider) return [];
  const raw = await provider.fetchTeamNews(team, limit);
  const now = new Date();
  return raw
    // Conservative relevance gate: drop women's/youth/other-topic articles that
    // only loosely matched the search, so unrelated names never become signals.
    .filter((r) => r.title && isRelevantTeamNews(team, r.title, r.summary))
    .map((r) => {
      const c = classifyNews(r.title, r.summary);
      return {
        team,
        title: r.title,
        summary: r.summary || r.title,
        category: c.category,
        impactLevel: c.impactLevel,
        affectedPlayers: c.affectedPlayers,
        sourceName: r.sourceName || provider.name,
        sourceUrl: r.sourceUrl,
        publishedAt: r.publishedAt,
        createdAt: now,
        direction: c.direction,
        demo: false,
      } satisfies TeamNewsItem;
    });
}

/**
 * Refresh news for the given teams (default: all tracked teams).
 * Uses the live provider when configured, otherwise curated demo signals.
 */
export async function refreshNews(
  teams: readonly string[] = TRACKED_TEAMS,
  perTeamLimit = 8
): Promise<NewsRefreshSummary> {
  const provider = getActiveProvider();
  const useApi = provider !== null;
  let storedTo: "mongodb" | "memory" = "memory";
  const perTeam: { team: string; count: number }[] = [];
  let total = 0;

  let first = true;
  for (const team of teams) {
    // Gentle pacing for free-tier rate limits (GNews throttles rapid bursts —
    // we saw later teams in a batch 429 and lose their live signals).
    if (useApi && !first) await new Promise((r) => setTimeout(r, 900));
    first = false;

    let items = useApi ? await fetchAndClassify(team, perTeamLimit) : [];
    // Fallback order: live fetch → KEEP last-known cached signals → demo only
    // when the store has nothing. A transient API failure must never overwrite
    // previously-fetched live signals with demo ones.
    if (items.length === 0) {
      if (await hasStoredNews(team)) {
        perTeam.push({ team, count: 0 }); // kept cached signals, nothing rewritten
        continue;
      }
      if (hasDemoNews(team)) items = getDemoNews(team);
    }
    if (items.length) {
      storedTo = await saveTeamNews(team, items);
      total += items.length;
    }
    perTeam.push({ team, count: items.length });
  }

  const source: NewsSource = useApi ? "api" : "demo";
  return {
    source,
    provider: provider?.name ?? null,
    storedTo,
    teamsRefreshed: teams.length,
    itemsRefreshed: total,
    perTeam,
    ranAt: new Date().toISOString(),
    note:
      source === "api"
        ? `Live news pulled via ${provider?.name} and classified.`
        : "No news API key configured — refreshed with curated demo signals (clearly labelled).",
  };
}

/**
 * Recent news for a single team, for the agent and the /news UI.
 * Seeds curated demo signals on the fly if the store is empty so the agent is
 * never "news-blind" in a demo.
 */
export async function getNewsForTeam(
  team: string,
  limit = 6
): Promise<{ items: TeamNewsItem[]; source: NewsSource; storedSource: "mongodb" | "memory" }> {
  const stored = await getTeamNews(team, limit);
  // Read-time relevance gate: also filters signals stored BEFORE the ingest
  // filter existed (e.g. women's/youth items), so off-topic names disappear
  // immediately instead of waiting for the next cron refresh. Demo items are
  // curated and skip the gate.
  const relevant = stored.items.filter(
    (i) => i.demo || isRelevantTeamNews(team, i.title, i.summary)
  );
  if (relevant.length > 0) {
    const source: NewsSource = relevant.some((i) => !i.demo) ? "api" : "demo";
    return { items: relevant, source, storedSource: stored.source };
  }
  // Empty store → seed demo on the fly (and persist so the rail stays warm).
  if (hasDemoNews(team)) {
    const demo = getDemoNews(team);
    const storedSource = await saveTeamNews(team, demo);
    return { items: demo.slice(0, limit), source: "demo", storedSource };
  }
  return { items: [], source: "demo", storedSource: stored.source };
}

export { TRACKED_TEAMS, newsProviderConfigured, getNewsStats, getLastNewsUpdate };
