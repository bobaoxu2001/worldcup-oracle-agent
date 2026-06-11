/**
 * News Classifier — turns a raw headline/snippet into structured signal:
 * a category, an impact level, a direction, and any generic role mentions.
 *
 * Deterministic keyword heuristics (no LLM needed). Used for items coming from
 * a live news/search API; curated demo items are already classified.
 */

import type { NewsCategory, NewsDirection, NewsImpact } from "./types";
import { getTeam } from "@/lib/seed/world-cup-2026-groups";

const KW: { cat: NewsCategory; words: RegExp }[] = [
  { cat: "injury", words: /\b(injur|knock|strain|hamstring|knee|ankle|sidelined|ruled out|fitness|doubt|recover|setback)\b/i },
  { cat: "suspension", words: /\b(suspend|ban|red card|booking|accumulat)\b/i },
  { cat: "squad", words: /\b(call[- ]?up|called up|squad|roster|replace|replacement|named|adds?|withdraw)\b/i },
  { cat: "coach", words: /\b(coach|manager|head coach|boss|press conference|announce)\b/i },
  { cat: "tactics", words: /\b(tactic|formation|press|shape|system|lineup|line-up|starting xi)\b/i },
  { cat: "form", words: /\b(form|fitness|fatigue|sharp|training|prepar|momentum|streak)\b/i },
];

const HIGH = /\b(ruled out|out for|major|serious|suspend|ban|will miss|sidelined for weeks|surgery)\b/i;
const MEDIUM = /\b(doubt|minor injury|knock|strain|monitored|day to day|day-to-day|fitness test|replacement)\b/i;

const POSITIVE = /\b(return|back in|recovered|fit again|available|boost|cleared|full training|no concerns)\b/i;
const NEGATIVE = /\b(injur|ruled out|doubt|suspend|ban|miss|fatigue|setback|withdraw|knock|strain)\b/i;

const ROLE = /\b(goalkeeper|keeper|defender|fullback|full-back|centre-back|center-back|midfielder|winger|forward|striker|captain)\b/gi;

// ── Conservative relevance gate ─────────────────────────────────────────────
// GNews search matches loosely (e.g. an Ireland women's match report that
// mentions "Brazil" once). Before an article becomes a stored signal it must
// clearly concern the target MEN'S NATIONAL team: mention the country name (or
// FIFA code), and not be a women's-football or youth/academy item unless the
// men's team is explicitly referenced. Conservative by design — better to drop
// a borderline article than surface unrelated names as "team news".
const WOMENS_RE = /\bwomen'?s?\b|\bfemale\b|\bladies\b|\bnwsl\b|\bwsl\b|\bfeminin[ae]\b/i;
const MENS_RE = /\bmen'?s\b/i;
const YOUTH_RE = /\bu-?(1[5-9]|2[0-3])s?\b|\bunder-?(1[5-9]|2[0-3])s?\b|\byouth\b|\bacademy\b/i;

export function isRelevantTeamNews(teamSlug: string, title: string, summary = ""): boolean {
  let name: string;
  let code: string;
  try {
    const t = getTeam(teamSlug);
    name = t.name.toLowerCase();
    code = t.fifaCode;
  } catch {
    return true; // unknown slug — don't block (defensive)
  }
  const raw = `${title} ${summary}`;
  const text = raw.toLowerCase();
  // Must explicitly mention the country/team name or its FIFA code.
  if (!text.includes(name) && !new RegExp(`\\b${code}\\b`).test(raw)) return false;
  // Women's-football items are a different squad unless the men's team is named.
  if (WOMENS_RE.test(raw) && !MENS_RE.test(raw)) return false;
  // Youth/academy squads are not the World Cup squad.
  if (YOUTH_RE.test(raw)) return false;
  return true;
}

export interface Classification {
  category: NewsCategory;
  impactLevel: NewsImpact;
  direction: NewsDirection;
  affectedPlayers: string[];
}

export function classifyNews(title: string, summary = ""): Classification {
  const text = `${title} ${summary}`;

  let category: NewsCategory = "other";
  for (const { cat, words } of KW) {
    if (words.test(text)) {
      category = cat;
      break;
    }
  }

  let impactLevel: NewsImpact = "low";
  if (HIGH.test(text)) impactLevel = "high";
  else if (MEDIUM.test(text)) impactLevel = "medium";

  let direction: NewsDirection = "neutral";
  if (POSITIVE.test(text)) direction = "positive";
  else if (NEGATIVE.test(text)) direction = "negative";
  // Tactics / coach updates default to neutral unless clearly +/-.

  const roles = Array.from(new Set((text.match(ROLE) ?? []).map((r) => r.toLowerCase())));

  return { category, impactLevel, direction, affectedPlayers: roles.slice(0, 3) };
}
