/**
 * News Classifier — turns a raw headline/snippet into structured signal:
 * a category, an impact level, a direction, and any generic role mentions.
 *
 * Deterministic keyword heuristics (no LLM needed). Used for items coming from
 * a live news/search API; curated demo items are already classified.
 */

import type { NewsCategory, NewsDirection, NewsImpact } from "./types";

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
