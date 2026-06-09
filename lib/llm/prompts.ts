/**
 * Prompt builders for the optional LLM layer.
 *
 * The intent classifier is the only LLM use wired up in this phase. It is told
 * explicitly NOT to invent probabilities, news, or suspensions — it only labels
 * the user's intent and (best-effort) the teams mentioned and the language.
 */

import type { ChatMessage } from "./deepseek";

/** Intent labels the classifier may return. */
export const LLM_INTENT_TYPES = [
  "MATCH_PREDICTION",
  "TOURNAMENT_FORECAST",
  "RULES_EXPLANATION",
  "TEAM_ANALYSIS",
  "TEAM_COMPARISON",
  "NEWS_OR_INJURY",
  "MODEL_EXPLANATION",
  "CLARIFICATION",
] as const;

export type LlmIntentType = (typeof LLM_INTENT_TYPES)[number];

export interface LlmIntentResult {
  intentType: LlmIntentType;
  language: "en" | "zh";
  teams: string[];
  confidence: number; // 0–1
  reason: string;
}

export function intentClassificationMessages(
  query: string,
  deterministicGuess: string
): ChatMessage[] {
  const system =
    `You are an intent classifier for a FIFA World Cup 2026 prediction agent. ` +
    `Classify the user's question. Respond with STRICT JSON ONLY, no prose, matching:\n` +
    `{"intentType": one of [${LLM_INTENT_TYPES.join(", ")}], ` +
    `"language": "en" or "zh", "teams": [array of national team names in English, may be empty], ` +
    `"confidence": number 0..1, "reason": "short reason"}\n\n` +
    `Definitions:\n` +
    `- MATCH_PREDICTION: who wins a specific two-team match (e.g. "Argentina vs Germany").\n` +
    `- TOURNAMENT_FORECAST: who wins the whole tournament / champion / top favorites.\n` +
    `- RULES_EXPLANATION: how the rules work (tie-breakers, best third-placed teams, yellow/red cards, format).\n` +
    `- TEAM_ANALYSIS: how good is one team.\n` +
    `- TEAM_COMPARISON: compare two teams generally (not a single match).\n` +
    `- NEWS_OR_INJURY: latest team news / injuries / suspensions.\n` +
    `- MODEL_EXPLANATION: how the model/agent works.\n` +
    `- CLARIFICATION: unclear or unsupported.\n\n` +
    `IMPORTANT: You ONLY classify. Do NOT predict scores or probabilities, do NOT state any news, ` +
    `injuries, or suspensions, and do NOT invent facts. Output JSON only.`;

  const user =
    `Question: """${query}"""\n` +
    `A heuristic parser guessed: "${deterministicGuess}". ` +
    `Use it only as a weak hint; decide yourself. Return the JSON now.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
