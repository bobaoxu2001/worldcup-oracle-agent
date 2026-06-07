/**
 * News Provider abstraction — a pluggable seam for live news/search APIs.
 *
 * Multiple providers are supported; the first one with a configured API key
 * wins. If NONE is configured, `getActiveProvider()` returns null and the
 * ingestor falls back to curated demo data — so the app always works.
 *
 * Add a new source by implementing `NewsProvider` and registering it in
 * PROVIDERS. Every network call is timed out and wrapped so a flaky API can
 * never break a prediction.
 *
 * Supported via env:
 *   NEWS_API_KEY            → NewsAPI.org
 *   GNEWS_API_KEY           → GNews.io
 *   SERPAPI_API_KEY         → SerpAPI (Google News engine)
 *   GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID → Google Custom Search
 */

import { getTeam } from "@/lib/seed/world-cup-2026-groups";

/** Raw, unclassified item as returned by a source. */
export interface RawNewsItem {
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: Date;
}

export interface NewsProvider {
  name: string;
  /** Fetch recent news for a team slug. Returns [] on any failure. */
  fetchTeamNews(teamSlug: string, limit: number): Promise<RawNewsItem[]>;
}

const FETCH_TIMEOUT_MS = 6000;

async function safeJson(url: string, init?: RequestInit): Promise<unknown | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Build the search query for a team ("Argentina national football team injury squad news"). */
function queryFor(teamSlug: string): string {
  const name = getTeam(teamSlug).name;
  return `${name} national football team injury squad call-up news`;
}

function asDate(s: unknown): Date {
  const d = s ? new Date(String(s)) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

// ── NewsAPI.org ────────────────────────────────────────────────────────────
const newsApiProvider: NewsProvider = {
  name: "NewsAPI",
  async fetchTeamNews(teamSlug, limit) {
    const key = process.env.NEWS_API_KEY;
    if (!key) return [];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      queryFor(teamSlug)
    )}&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${key}`;
    const data = (await safeJson(url)) as { articles?: any[] } | null;
    return (data?.articles ?? []).map((a) => ({
      title: a.title ?? "",
      summary: a.description ?? a.content ?? "",
      sourceName: a.source?.name ?? "NewsAPI",
      sourceUrl: a.url ?? "",
      publishedAt: asDate(a.publishedAt),
    }));
  },
};

// ── GNews.io ────────────────────────────────────────────────────────────────
const gnewsProvider: NewsProvider = {
  name: "GNews",
  async fetchTeamNews(teamSlug, limit) {
    const key = process.env.GNEWS_API_KEY;
    if (!key) return [];
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
      queryFor(teamSlug)
    )}&lang=en&max=${limit}&apikey=${key}`;
    const data = (await safeJson(url)) as { articles?: any[] } | null;
    return (data?.articles ?? []).map((a) => ({
      title: a.title ?? "",
      summary: a.description ?? "",
      sourceName: a.source?.name ?? "GNews",
      sourceUrl: a.url ?? "",
      publishedAt: asDate(a.publishedAt),
    }));
  },
};

// ── SerpAPI (Google News engine) ─────────────────────────────────────────────
const serpApiProvider: NewsProvider = {
  name: "SerpAPI",
  async fetchTeamNews(teamSlug, limit) {
    const key = process.env.SERPAPI_API_KEY;
    if (!key) return [];
    const url = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(
      queryFor(teamSlug)
    )}&api_key=${key}`;
    const data = (await safeJson(url)) as { news_results?: any[] } | null;
    return (data?.news_results ?? []).slice(0, limit).map((a) => ({
      title: a.title ?? "",
      summary: a.snippet ?? "",
      sourceName: a.source?.name ?? a.source ?? "Google News",
      sourceUrl: a.link ?? "",
      publishedAt: asDate(a.date),
    }));
  },
};

// ── Google Custom Search ──────────────────────────────────────────────────────
const googleCseProvider: NewsProvider = {
  name: "Google Custom Search",
  async fetchTeamNews(teamSlug, limit) {
    const key = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
    if (!key || !cx) return [];
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(
      queryFor(teamSlug)
    )}&num=${Math.min(limit, 10)}&sort=date`;
    const data = (await safeJson(url)) as { items?: any[] } | null;
    return (data?.items ?? []).map((a) => ({
      title: a.title ?? "",
      summary: a.snippet ?? "",
      sourceName: a.displayLink ?? "Google",
      sourceUrl: a.link ?? "",
      publishedAt: new Date(),
    }));
  },
};

// Priority order (first configured wins): GNews → SerpAPI → NewsAPI → Google CSE.
const PROVIDERS: { isConfigured: () => boolean; provider: NewsProvider }[] = [
  { isConfigured: () => !!process.env.GNEWS_API_KEY, provider: gnewsProvider },
  { isConfigured: () => !!process.env.SERPAPI_API_KEY, provider: serpApiProvider },
  { isConfigured: () => !!process.env.NEWS_API_KEY, provider: newsApiProvider },
  {
    isConfigured: () =>
      !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_SEARCH_ENGINE_ID,
    provider: googleCseProvider,
  },
];

/** The first configured provider, or null if no key is set (→ demo fallback). */
export function getActiveProvider(): NewsProvider | null {
  return PROVIDERS.find((p) => p.isConfigured())?.provider ?? null;
}

export function newsProviderConfigured(): boolean {
  return getActiveProvider() !== null;
}
