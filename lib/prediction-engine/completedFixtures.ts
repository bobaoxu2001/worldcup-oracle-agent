/**
 * Completed-fixture lookup — "has this exact pairing already been played?"
 *
 * The tournament is live, so a user can ask about a fixture that has ALREADY
 * happened. The prediction engine still produces a post-result-adjusted read,
 * but presenting it as if the match were upcoming would be dishonest. This
 * helper surfaces the real recorded score and labels the model read as a
 * retrospective estimate.
 *
 * Source of truth: the combined recorded-results layer (historical manual seed
 * plus the append-only latest-knockout layer). Lookups are order-independent and
 * work for both group and knockout fixtures.
 */

import { ALL_MATCH_RESULTS } from "@/lib/seed/recorded-match-results";

export interface CompletedFixture {
  /** Requested order — scoreA belongs to slugA, scoreB to slugB. */
  slugA: string;
  slugB: string;
  scoreA: number;
  scoreB: number;
  /** "A" = slugA won, "B" = slugB won, "draw". */
  outcome: "A" | "B" | "draw";
  group: string;
  date?: string;
  note?: string;
}

/**
 * The completed result for the pairing {slugA, slugB}, oriented to the requested
 * order, or null if these two teams have not played a recorded fixture. Matching
 * is order-independent: getCompletedFixture(a, b) and getCompletedFixture(b, a)
 * describe the same game with scores/outcome flipped to match the argument order.
 */
export function getCompletedFixture(
  slugA: string,
  slugB: string
): CompletedFixture | null {
  const m = ALL_MATCH_RESULTS.find(
    (r) =>
      (r.teamA === slugA && r.teamB === slugB) ||
      (r.teamA === slugB && r.teamB === slugA)
  );
  if (!m) return null;
  // The stored entry may be in the opposite order to the request.
  const flipped = m.teamA === slugB;
  const scoreA = flipped ? m.scoreB : m.scoreA;
  const scoreB = flipped ? m.scoreA : m.scoreB;
  const outcome = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "draw";
  return { slugA, slugB, scoreA, scoreB, outcome, group: m.group, date: m.date, note: m.note };
}

/** True when this exact pairing has a recorded completed result. */
export function hasBeenPlayed(slugA: string, slugB: string): boolean {
  return getCompletedFixture(slugA, slugB) !== null;
}

/**
 * A short, deterministic "already played" banner to PREPEND to a match
 * narrative (English / 简体中文). Returns "" when the fixture has not been
 * played, so callers can prepend unconditionally. Team names are passed in so
 * the line matches the display names used elsewhere in the answer.
 */
export function completedFixtureNote(
  result: CompletedFixture | null,
  nameA: string,
  nameB: string,
  lang: string
): string {
  if (!result) return "";
  const when = result.date ? ` (${result.date})` : "";
  const scoreline = `${nameA} ${result.scoreA}–${result.scoreB} ${nameB}`;
  if (lang === "zh-CN") {
    return `**这场比赛已经结束${when}。** 最终比分：**${scoreline}**。以下是模型的赛前分析，仅供参考。\n\n`;
  }
  return `**This fixture has already been played${when}.** Final result: **${scoreline}**. The model's pre-match read is shown below for reference.\n\n`;
}
