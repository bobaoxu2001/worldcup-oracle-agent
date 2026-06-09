/**
 * LLM provider abstraction.
 *
 * A thin seam so the agent can use an optional LLM (currently DeepSeek) for
 * intent classification while the deterministic engine remains the single source
 * of truth for every number, news item, and ruling. If no provider is configured
 * (no AI_PROVIDER / DEEPSEEK_API_KEY), all functions no-op to null and callers
 * fall back to the deterministic parser.
 */

import { deepseekChat, deepseekConfigured } from "./deepseek";
import {
  intentClassificationMessages,
  LLM_INTENT_TYPES,
  type LlmIntentResult,
  type LlmIntentType,
} from "./prompts";

export type { LlmIntentResult, LlmIntentType } from "./prompts";

/** Which LLM provider is active, or null. */
export function llmProvider(): "deepseek" | null {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "deepseek" && deepseekConfigured()) return "deepseek";
  // Tolerate DEEPSEEK_API_KEY without AI_PROVIDER explicitly set to deepseek.
  if (!provider && deepseekConfigured()) return "deepseek";
  return null;
}

export function llmConfigured(): boolean {
  return llmProvider() !== null;
}

function safeParseIntent(text: string): LlmIntentResult | null {
  try {
    // Tolerate code-fences or stray text around the JSON object.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const obj = JSON.parse(match[0]) as Partial<LlmIntentResult>;
    if (!obj.intentType || !LLM_INTENT_TYPES.includes(obj.intentType as LlmIntentType)) {
      return null;
    }
    return {
      intentType: obj.intentType as LlmIntentType,
      language: obj.language === "zh" ? "zh" : "en",
      teams: Array.isArray(obj.teams) ? obj.teams.filter((t) => typeof t === "string").slice(0, 4) : [],
      confidence: typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0.5,
      reason: typeof obj.reason === "string" ? obj.reason.slice(0, 200) : "",
    };
  } catch {
    return null;
  }
}

/**
 * Classify the user's intent with the LLM. Returns null if no provider is
 * configured or the call fails — callers MUST fall back to the deterministic
 * parser in that case.
 *
 * The LLM only labels intent; it never produces probabilities or facts.
 */
export async function classifyIntentWithLLM(
  query: string,
  deterministicGuess: string
): Promise<LlmIntentResult | null> {
  if (llmProvider() !== "deepseek") return null;
  const messages = intentClassificationMessages(query, deterministicGuess);
  const out = await deepseekChat(messages, { json: true, maxTokens: 200, timeoutMs: 6000 });
  if (!out) return null;
  return safeParseIntent(out);
}
