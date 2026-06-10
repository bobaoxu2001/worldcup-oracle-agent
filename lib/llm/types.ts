/**
 * Shared types for the optional LLM layer (DeepSeek today; Gemini for legacy
 * translation polish). The LLM NEVER produces probabilities, news, injuries,
 * suspensions, or sources — it only classifies intent and narrates structured
 * results that the deterministic engine produced.
 */

/** Intent labels the LLM classifier may return (superset of agent intents). */
export const LLM_INTENT_TYPES = [
  "MATCH_PREDICTION",
  "TOURNAMENT_FORECAST",
  "GROUP_QUALIFICATION",
  "PATH_ANALYSIS",
  "TEAM_ANALYSIS",
  "TEAM_COMPARISON",
  "NEWS_OR_INJURY",
  "RULES_EXPLANATION",
  "MODEL_EXPLANATION",
  "CLARIFICATION",
] as const;

export type LlmIntentType = (typeof LLM_INTENT_TYPES)[number];

/** Strict-JSON shape the intent classifier must return. */
export interface LlmIntentResult {
  intentType: LlmIntentType;
  language: "en" | "zh";
  teams: string[];
  group: string | null; // "A".."L" when the question names a group
  stage: string | null; // e.g. "round-of-32", "final"
  confidence: number; // 0–1
  reason: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
