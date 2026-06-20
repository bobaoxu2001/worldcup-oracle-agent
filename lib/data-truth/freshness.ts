/**
 * Data-truth & freshness — the single place that answers "how current is what we
 * actually know?" for a LIVE tournament.
 *
 * WHY THIS EXISTS:
 *   Freshness signals were scattered across the codebase — the schedule page
 *   computed a "results through" date inline, the news layer tracks its own last
 *   update, and the live-fixtures cache carries a `fetchedAt`. Nothing aggregated
 *   them, and the conversational agent never told the user how recent the results
 *   and standings behind a prediction were. This module centralises that so every
 *   surface (agent answers, UI, API) reports recency honestly and consistently.
 *
 * SOURCES OF TRUTH (reused, not duplicated):
 *   • recorded results — lib/seed/manual-match-results.ts (the verified-manual layer)
 *   • live fixtures cache — getCachedFixtures() (lib/live-sports/tournamentState.ts)
 *   • team news — newsMode() / getLastNewsUpdate() (lib/news/*)
 *
 * Everything here is honest about absence: missing/empty data yields a "none"
 * label and an empty footnote, never a fabricated freshness claim.
 */

import { MANUAL_MATCH_RESULTS } from "@/lib/seed/manual-match-results";
import { getCachedFixtures } from "@/lib/live-sports/tournamentState";
import { newsMode, getLastNewsUpdate } from "@/lib/news/newsIngestor";
import type { NewsSource } from "@/lib/news/types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export type FreshnessLabel = "live" | "recent" | "stale" | "none";

export interface FreshnessClass {
  label: FreshnessLabel;
  /** Whole days between `asOf` and now (0 = today). null when there is no date. */
  ageDays: number | null;
  /** One-line, human-readable read of the recency. */
  note: string;
}

/** Latest recorded completed-result date (YYYY-MM-DD), or null if none on file. */
export function getLatestVerifiedResultDate(): string | null {
  let max: string | null = null;
  for (const r of MANUAL_MATCH_RESULTS) {
    if (r.date && (max === null || r.date > max)) max = r.date;
  }
  return max;
}

/** How many completed results have been recorded into the verified-manual layer. */
export function getRecordedResultCount(): number {
  return MANUAL_MATCH_RESULTS.length;
}

/**
 * Classify how fresh a date is relative to `now`. Pure and deterministic so it is
 * trivially testable. Thresholds: same/next day → "live"; ≤3 days → "recent";
 * older → "stale"; missing/unparseable → "none".
 */
export function classifyFreshness(asOf: string | null, now: Date = new Date()): FreshnessClass {
  if (!asOf) return { label: "none", ageDays: null, note: "No recorded results yet." };
  const t = Date.parse(asOf.length === 10 ? `${asOf}T00:00:00Z` : asOf);
  if (Number.isNaN(t)) return { label: "none", ageDays: null, note: "No recorded results yet." };
  const ageDays = Math.max(0, Math.floor((now.getTime() - t) / DAY_MS));
  if (ageDays <= 1) return { label: "live", ageDays, note: `Recorded results are current (latest ${asOf}).` };
  if (ageDays <= 3) return { label: "recent", ageDays, note: `Latest recorded result is ${asOf} (${ageDays}d ago).` };
  return {
    label: "stale",
    ageDays,
    note: `Latest recorded result is ${asOf} (${ageDays}d ago) — standings/strength may lag live play.`,
  };
}

export interface DataFreshnessSummary {
  /** When this summary was taken (ISO). */
  asOf: string;
  results: {
    latestDate: string | null;
    count: number;
    freshness: FreshnessClass;
  };
  liveCache: {
    fetchedAt: string | null;
    /** Hours since the live-fixtures cache was fetched, or null if never. */
    ageHours: number | null;
  };
  news: {
    mode: NewsSource; // "api" | "demo"
    provider: string | null;
    lastUpdate: string | null; // ISO
  };
}

/**
 * Aggregate the freshness of every data layer into one honest summary. Safe to
 * call anywhere (read-only; tolerates a missing live cache / news store).
 */
export async function getDataFreshnessSummary(now: Date = new Date()): Promise<DataFreshnessSummary> {
  const latestDate = getLatestVerifiedResultDate();

  let fetchedAt: string | null = null;
  try {
    fetchedAt = (await getCachedFixtures()).fetchedAt;
  } catch {
    fetchedAt = null; // no cache / no DB → honestly null, never invented
  }
  const cacheT = fetchedAt ? Date.parse(fetchedAt) : NaN;
  const ageHours = Number.isNaN(cacheT)
    ? null
    : Math.round((Math.max(0, now.getTime() - cacheT) / HOUR_MS) * 10) / 10;

  let nm: { mode: NewsSource; provider: string | null } = { mode: "demo", provider: null };
  let lastNews: Date | null = null;
  try {
    nm = newsMode();
    lastNews = getLastNewsUpdate();
  } catch {
    /* keep honest defaults */
  }

  return {
    asOf: now.toISOString(),
    results: {
      latestDate,
      count: getRecordedResultCount(),
      freshness: classifyFreshness(latestDate, now),
    },
    liveCache: { fetchedAt, ageHours },
    news: { mode: nm.mode, provider: nm.provider, lastUpdate: lastNews ? lastNews.toISOString() : null },
  };
}

// ── Display helpers ──────────────────────────────────────────────────────────

function parseUTC(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
}
/** "Jun 19" (UTC, locale-stable). */
function fmtEN(iso: string): string {
  const d = parseUTC(iso);
  return Number.isNaN(+d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
/** "6月19日". */
function fmtZH(iso: string): string {
  const d = parseUTC(iso);
  return Number.isNaN(+d) ? iso : `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

/**
 * A short, deterministic data-freshness footnote for an UPCOMING-fixture answer
 * (English / 简体中文). Tells the user how current the results behind the model's
 * read are, and warns when they are stale. Returns "" when nothing is recorded
 * yet, so callers can append unconditionally. Designed to be added AFTER any LLM
 * polish so it cannot be paraphrased away.
 */
export function freshnessFootnote(lang: string, now: Date = new Date()): string {
  const latest = getLatestVerifiedResultDate();
  const fc = classifyFreshness(latest, now);
  if (fc.label === "none" || !latest) return "";
  const stale = fc.label === "stale";
  if (lang === "zh-CN") {
    return stale
      ? `\n\n_⚠️ 最近录入的赛果为 ${fmtZH(latest)}(${fc.ageDays} 天前),积分榜/实力评估可能滞后于最新比赛。_`
      : `\n\n_模型读数基于已录入至 ${fmtZH(latest)} 的赛果;距开球前的阵容/伤停消息仍可能改变结果。_`;
  }
  return stale
    ? `\n\n_⚠️ Latest recorded result is ${fmtEN(latest)} (${fc.ageDays}d ago) — standings/strength may lag live play._`
    : `\n\n_Model read from recorded results through ${fmtEN(latest)}; squad & lineup news up to kickoff can still move it._`;
}
