/**
 * Gemini abstraction layer — the agent's optional "narrator".
 *
 * The agent's REASONING and NUMBERS are 100% deterministic (Elo + Dixon-Coles +
 * Monte Carlo). Gemini is used only to polish the explanation into livelier
 * prose when a GOOGLE_API_KEY is present. When it is not — which is the default
 * for the demo — every caller falls back to the deterministic generator and the
 * product works identically. No paid or unavailable API can break the demo.
 *
 * This is the single seam where Google Cloud / Gemini plugs in for the
 * Rapid Agent Hackathon.
 */

import { analystNarrativePrompt, polishPrompt } from "./prompts";

const MODEL = "gemini-2.0-flash";
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 10);
}

/**
 * Ask Gemini to rewrite/extend a piece of text. Returns null on any failure
 * (no key, network error, bad response) so callers can fall back cleanly.
 * Uses a short timeout so a slow API never stalls the demo.
 */
export async function geminiGenerate(
  prompt: string,
  opts: { maxTokens?: number; timeoutMs?: number } = {}
): Promise<string | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);

  try {
    const res = await fetch(ENDPOINT(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: opts.maxTokens ?? 400,
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Gemini analyst narrative from a structured result (the JSON is the only source
 * of truth). Used by the cost-aware router for complex/escalated queries.
 * Returns null on any failure so the router can fall back to DeepSeek.
 */
export async function geminiNarrative(
  structuredJson: string,
  language: "en" | "zh"
): Promise<string | null> {
  if (!geminiConfigured()) return null;
  const out = await geminiGenerate(analystNarrativePrompt(structuredJson, language), {
    maxTokens: 700,
    timeoutMs: 9000,
  });
  return out && out.length > 40 ? out : null;
}

/** Gemini polish of a deterministic English explanation (numbers preserved). */
export async function geminiPolish(
  deterministic: string,
  context: string
): Promise<string | null> {
  if (!geminiConfigured()) return null;
  const out = await geminiGenerate(polishPrompt(deterministic, context), {
    maxTokens: 450,
    timeoutMs: 9000,
  });
  return out && out.length > 40 ? out : null;
}
