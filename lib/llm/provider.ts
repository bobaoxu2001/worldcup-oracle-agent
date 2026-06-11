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
import { geminiConfigured, geminiNarrative, geminiPolish } from "./gemini";
import {
  intentClassificationMessages,
  analystNarrativeMessages,
  clarificationMessages,
  translationMessages,
  polishMessages,
  LLM_INTENT_TYPES,
} from "./prompts";
import type { LlmIntentResult, LlmIntentType } from "./types";

export type { LlmIntentResult, LlmIntentType } from "./types";

/** A provider that actually produced output, or null for deterministic. */
export type ActiveProvider = "deepseek" | "gemini";
export type ProviderChoice = ActiveProvider | "none";

/** Signals the cost-aware router uses to decide DeepSeek vs Gemini. */
export interface ComplexitySignals {
  /** Plan intent (kebab-case, e.g. "path-analysis"). */
  intent?: string;
  /** Number of teams referenced by the structured result. */
  teamCount?: number;
  /** Deterministic confidence 0..100 (low → escalate). */
  confidence?: number;
  /** UI language code (e.g. "zh-CN"). */
  language?: string;
}

// Intents that inherently require multi-step / cross-group reasoning.
const COMPLEX_INTENTS = new Set(["path-analysis", "group-qualification"]);
// Stem matches (leading word boundary only) so plurals/inflections still hit:
// "rules", "advances", "wins", "qualifies".
const COMPLEX_QUERY_RE =
  /\b(path|route|knockout|bracket|qualif|advance|best[- ]?third|third[- ]?place|win the group|group stage|all the way|deep run|go far)/i;
const COMPLEX_ZH_RE =
  /(路径|晋级之路|晋级|淘汰赛|出线|小组出线|最佳第三|第三名|夺冠之路|一路|走多远)/;
const RULES_RE = /\b(rule|tie-?break|fair[- ]?play|yellow|red card|format|advance|seeding)|规则|平局|净胜球|黄牌|红牌|公平竞赛|并列/i;
const PREDICT_RE = /\b(win|odd|chance|probab|predict|forecast|simulat|champion|qualif)|赢|概率|预测|夺冠|模拟|冠军/i;

/**
 * Heuristic: is this query complex/ambiguous enough to warrant the premium
 * (Gemini) provider? Pure function — no I/O, no env. Numbers/rules are never
 * affected; this only chooses which LLM writes the prose.
 */
export function assessComplexity(query: string, s: ComplexitySignals = {}): boolean {
  const q = query || "";
  if (s.intent && COMPLEX_INTENTS.has(s.intent)) return true; // path / group qualification
  if ((s.teamCount ?? 0) > 2) return true; // more than two teams
  // Low deterministic confidence escalates — EXCEPT team comparison, whose
  // "confidence" is the (often <50%) head-to-head win probability, not a measure
  // of classification/answer uncertainty.
  if (typeof s.confidence === "number" && s.confidence < 45 && s.intent !== "team-comparison") return true;
  if (COMPLEX_QUERY_RE.test(q) || COMPLEX_ZH_RE.test(q)) return true; // bracket/path/third-place wording
  if (RULES_RE.test(q) && PREDICT_RE.test(q)) return true; // rules + prediction combined
  if (s.language === "zh-CN" && q.length > 40 && /(分析|详细|解释|为什么|说明|怎么)/.test(q)) return true; // long zh explanation
  return false;
}

/**
 * Cost-aware provider selection. DeepSeek is the low-cost default for routine
 * narrative/localization; Gemini is the premium escalation for complex/ambiguous
 * queries; otherwise falls back across whatever is configured, then "none"
 * (deterministic). Never affects probabilities, rules, or structured outputs.
 */
export function selectLLMProvider(opts: { query: string } & ComplexitySignals): ProviderChoice {
  const ds = deepseekConfigured();
  const gm = geminiConfigured();
  if (!ds && !gm) return "none";
  const complex = assessComplexity(opts.query, opts);
  if (complex && gm) return "gemini"; // escalate complex work to Gemini when available
  if (ds) return "deepseek"; // default low-cost provider
  if (gm) return "gemini"; // Gemini-only deployment
  return "none";
}

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

/** DeepSeek polish of a deterministic English explanation (numbers preserved). */
async function deepseekPolish(deterministic: string, context: string): Promise<string | null> {
  const out = await deepseekChat(polishMessages(deterministic, context), {
    maxTokens: 500,
    timeoutMs: 9000,
    temperature: 0.5,
  });
  return out && out.length > 40 ? out : null;
}

async function deepseekNarrative(json: string, language: "en" | "zh"): Promise<string | null> {
  const out = await deepseekChat(analystNarrativeMessages(json, language), {
    maxTokens: 700,
    timeoutMs: 9000,
    temperature: 0.4,
  });
  return out && out.length > 40 ? out : null;
}

/**
 * Cost-aware analyst narrative from a structured result. Picks the provider via
 * {@link selectLLMProvider} (DeepSeek default, Gemini for complex), falling back
 * to the other provider on failure, then to deterministic ("none"). Returns the
 * text plus the provider that actually produced it (for transparency + memory).
 */
export async function generateNarrative(
  structuredResult: unknown,
  language: "en" | "zh",
  opts: { query: string } & ComplexitySignals
): Promise<{ text: string | null; provider: ActiveProvider | null }> {
  let json: string;
  try {
    json = JSON.stringify(structuredResult).slice(0, 6000);
  } catch {
    return { text: null, provider: null };
  }
  const choice = selectLLMProvider(opts);
  if (choice === "none") return { text: null, provider: null };

  if (choice === "gemini") {
    const g = await geminiNarrative(json, language);
    if (g) return { text: g, provider: "gemini" };
    if (deepseekConfigured()) {
      const d = await deepseekNarrative(json, language);
      if (d) return { text: d, provider: "deepseek" };
    }
    return { text: null, provider: null };
  }
  // choice === "deepseek"
  const d = await deepseekNarrative(json, language);
  if (d) return { text: d, provider: "deepseek" };
  if (geminiConfigured()) {
    const g = await geminiNarrative(json, language);
    if (g) return { text: g, provider: "gemini" };
  }
  return { text: null, provider: null };
}

/**
 * Cost-aware polish of a deterministic English explanation (used by the flagship
 * match / champion / news flows). Same routing + fallback as
 * {@link generateNarrative}; returns the original text + null provider if no LLM
 * succeeds, so the deterministic prose is preserved.
 */
export async function polishNarrative(
  deterministic: string,
  context: string,
  opts: { query: string } & ComplexitySignals
): Promise<{ text: string; provider: ActiveProvider | null }> {
  const choice = selectLLMProvider(opts);
  if (choice === "none") return { text: deterministic, provider: null };

  if (choice === "gemini") {
    const g = await geminiPolish(deterministic, context);
    if (g) return { text: g, provider: "gemini" };
    if (deepseekConfigured()) {
      const d = await deepseekPolish(deterministic, context);
      if (d) return { text: d, provider: "deepseek" };
    }
    return { text: deterministic, provider: null };
  }
  const d = await deepseekPolish(deterministic, context);
  if (d) return { text: d, provider: "deepseek" };
  if (geminiConfigured()) {
    const g = await geminiPolish(deterministic, context);
    if (g) return { text: g, provider: "gemini" };
  }
  return { text: deterministic, provider: null };
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
