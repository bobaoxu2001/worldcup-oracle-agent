/**
 * LLM provider abstraction.
 *
 * A thin seam so the agent can use an optional LLM (currently DeepSeek) for
 * intent classification, analyst narratives, and clarifications, while the
 * deterministic engine remains the single source of truth for every number,
 * news item, and ruling. If no provider is configured (no AI_PROVIDER /
 * DEEPSEEK_API_KEY), all functions return null and callers fall back to the
 * deterministic parser/templates.
 */

import { deepseekChat, deepseekConfigured } from "./deepseek";
import {
  intentClassificationMessages,
  analystNarrativeMessages,
  clarificationMessages,
  translationMessages,
  LLM_INTENT_TYPES,
} from "./prompts";
import type { LlmIntentResult, LlmIntentType } from "./types";

export type { LlmIntentResult, LlmIntentType } from "./types";

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
    const group =
      typeof obj.group === "string" && /^[A-La-l]$/.test(obj.group.trim())
        ? obj.group.trim().toUpperCase()
        : null;
    return {
      intentType: obj.intentType as LlmIntentType,
      language: obj.language === "zh" ? "zh" : "en",
      teams: Array.isArray(obj.teams)
        ? obj.teams.filter((t) => typeof t === "string").slice(0, 4)
        : [],
      group,
      stage: typeof obj.stage === "string" ? obj.stage.slice(0, 40) : null,
      confidence:
        typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0.5,
      reason: typeof obj.reason === "string" ? obj.reason.slice(0, 200) : "",
    };
  } catch {
    return null;
  }
}

/**
 * Classify the user's intent with the LLM. Returns null if no provider is
 * configured or the call fails — callers MUST fall back to the deterministic
 * parser. The LLM only labels intent; it never produces probabilities or facts.
 */
export async function classifyIntentWithLLM(
  query: string,
  deterministicGuess: string
): Promise<LlmIntentResult | null> {
  if (!llmConfigured()) return null;
  const messages = intentClassificationMessages(query, deterministicGuess);
  const out = await deepseekChat(messages, { json: true, maxTokens: 250, timeoutMs: 6000 });
  if (!out) return null;
  return safeParseIntent(out);
}

/**
 * Turn a structured, deterministic result into analyst prose in the requested
 * language. Returns null on any failure so callers keep the deterministic text.
 * The structured result is the only source of truth; the prompt forbids
 * inventing numbers, news, injuries, suspensions, or sources.
 */
export async function generateAnalystNarrative(
  structuredResult: unknown,
  language: "en" | "zh"
): Promise<string | null> {
  if (!llmConfigured()) return null;
  let json: string;
  try {
    json = JSON.stringify(structuredResult).slice(0, 6000);
  } catch {
    return null;
  }
  const out = await deepseekChat(analystNarrativeMessages(json, language), {
    maxTokens: 700,
    timeoutMs: 9000,
    temperature: 0.4,
  });
  return out && out.length > 40 ? out : null;
}

/**
 * Friendly clarification for unclear queries. Returns null on failure so
 * callers use the deterministic clarification template.
 */
export async function generateClarification(
  query: string,
  supportedExamples: string[],
  language: "en" | "zh" = "en"
): Promise<string | null> {
  if (!llmConfigured()) return null;
  const out = await deepseekChat(clarificationMessages(query, supportedExamples, language), {
    maxTokens: 300,
    timeoutMs: 6000,
    temperature: 0.3,
  });
  return out && out.length > 20 ? out : null;
}

/**
 * Number-preserving translation via DeepSeek (used as a fallback when Gemini
 * is not configured). Returns null on failure.
 */
export async function llmTranslate(text: string, targetLanguage: string): Promise<string | null> {
  if (!llmConfigured()) return null;
  const out = await deepseekChat(translationMessages(text, targetLanguage), {
    maxTokens: 800,
    timeoutMs: 9000,
  });
  return out && out.length > 5 ? out : null;
}
