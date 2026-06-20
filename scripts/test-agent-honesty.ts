/**
 * Honesty checks for the conversational agent (deterministic, offline).
 * Run: npm run test:honesty
 *
 * Covers the two safeguards that must survive LLM polishing:
 *   1. the data-freshness footnote the agent appends to UPCOMING predictions, and
 *   2. the betting/tipping detection that triggers the "not betting advice" caveat.
 * Both are tested via their pure functions so no network/LLM/DB is touched.
 */

import { freshnessFootnote, getLatestVerifiedResultDate } from "../lib/data-truth/freshness";
import { mentionsBetting } from "../lib/agent";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// ── 1. Freshness footnote ────────────────────────────────────────────────────
const latest = getLatestVerifiedResultDate();
if (!latest) throw new Error("expected recorded results on file for the footnote test");

// "recent": clock just after the latest recorded result.
const recentNow = new Date(`${latest}T18:00:00Z`);
const enRecent = freshnessFootnote("en-US", recentNow);
check("recent EN footnote is present", enRecent.length > 0);
check("recent EN footnote frames it as a model read, not a tip", /model read from recorded results through/i.test(enRecent));
check("recent EN footnote is NOT a stale warning", !enRecent.includes("⚠️"));

const zhRecent = freshnessFootnote("zh-CN", recentNow);
check("recent zh-CN footnote is localized", zhRecent.includes("模型读数"));

// "stale": clock well after the latest recorded result.
const staleNow = new Date(`${latest}T00:00:00Z`);
staleNow.setUTCDate(staleNow.getUTCDate() + 9);
const enStale = freshnessFootnote("en-US", staleNow);
check("stale EN footnote carries the ⚠️ warning", enStale.includes("⚠️") && /may lag live play/i.test(enStale));
check("stale zh-CN footnote carries the ⚠️ warning", freshnessFootnote("zh-CN", staleNow).includes("⚠️"));

// ── 2. Betting / tipping detection ───────────────────────────────────────────
for (const q of [
  "Should I bet on this?",
  "is Brazil a safe pick to win?",
  "give me a sure thing for tonight",
  "should I back England here?",
  "what's the lock of the day?",
  "我想投注这场比赛",
]) {
  check(`betting cue detected: ${JSON.stringify(q)}`, mentionsBetting(q));
}
// Must NOT false-positive on ordinary football language.
for (const q of [
  "Brazil locker room conflict",
  "what's the background on this rivalry?",
  "who will win Mexico vs South Korea?",
  "compare Argentina and France",
]) {
  check(`no false betting positive: ${JSON.stringify(q)}`, !mentionsBetting(q));
}

console.log(failures === 0 ? "\nAll agent-honesty checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
