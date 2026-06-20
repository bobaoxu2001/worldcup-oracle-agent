/**
 * Sanity checks for the centralized data-truth / freshness layer
 * (lib/data-truth/freshness.ts).
 * Run: npm run test:freshness
 *
 * Data-driven: the "latest result date" is compared to the real max over the
 * recorded results (computed here independently), so it never goes stale as
 * matchdays land. A fixed `now` is injected where recency matters, for
 * determinism.
 */

import {
  getLatestVerifiedResultDate,
  getRecordedResultCount,
  classifyFreshness,
  getDataFreshnessSummary,
} from "../lib/data-truth/freshness";
import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function main() {
  // 1. Latest verified result date == the true max over the recorded layer.
  const trueMax = MANUAL_MATCH_RESULTS.reduce<string | null>(
    (m, r) => (r.date && (m === null || r.date > m) ? r.date : m),
    null
  );
  check("getLatestVerifiedResultDate equals the real max recorded date", getLatestVerifiedResultDate() === trueMax, `${getLatestVerifiedResultDate()}`);
  check("getRecordedResultCount equals the recorded array length", getRecordedResultCount() === MANUAL_MATCH_RESULTS.length, `${getRecordedResultCount()}`);

  // 2. classifyFreshness thresholds (deterministic via injected `now`).
  check("null date → label 'none'", classifyFreshness(null).label === "none");
  check("garbage date → label 'none'", classifyFreshness("not-a-date").label === "none");
  const ref = new Date("2026-06-20T12:00:00Z");
  check("same-day date → 'live'", classifyFreshness("2026-06-20", ref).label === "live");
  check("2 days old → 'recent'", classifyFreshness("2026-06-18", ref).label === "recent", `age ${classifyFreshness("2026-06-18", ref).ageDays}`);
  check("10 days old → 'stale'", classifyFreshness("2026-06-10", ref).label === "stale", `age ${classifyFreshness("2026-06-10", ref).ageDays}`);
  check("future date never reports a negative age", (classifyFreshness("2026-06-25", ref).ageDays ?? -1) >= 0);

  // 3. getDataFreshnessSummary aggregates honestly (offline: no live cache / demo news).
  const summary = await getDataFreshnessSummary(ref);
  check("summary result count matches recorded count", summary.results.count === getRecordedResultCount());
  check("summary latest date matches helper", summary.results.latestDate === getLatestVerifiedResultDate());
  check("summary carries a freshness classification", typeof summary.results.freshness.label === "string");
  check("summary news mode is 'api' or 'demo' (never fabricated)", summary.news.mode === "api" || summary.news.mode === "demo");
  check("summary liveCache.ageHours is null or a number (honest about a missing cache)", summary.liveCache.ageHours === null || typeof summary.liveCache.ageHours === "number");
  check("summary asOf echoes the injected clock", summary.asOf === ref.toISOString());

  console.log(failures === 0 ? "\nAll freshness checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
