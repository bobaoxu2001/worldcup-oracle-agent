/**
 * Response localizer — translates the agent's English narrative into the selected
 * language for Global Voice Mode.
 *
 *   • If Gemini is configured, it rewrites the explanation in the target language
 *     with strict instructions to keep EVERY number/percentage/team name exact.
 *   • If Gemini is not configured, the English narrative is kept and a
 *     deterministic, in-language **result summary** (built from the numbers) is
 *     shown + spoken instead — numbers can never drift because the summary is
 *     assembled from the structured result, not translated text.
 *
 * The numbers themselves are NEVER produced by an LLM — only the prose.
 */

import { geminiGenerate, geminiConfigured } from "@/lib/llm/gemini";
import { getLanguage, type LangCode } from "./languages";
import { llmConfigured, llmTranslate } from "@/lib/llm/provider";
import type { PredictionResult, ChampionAnswer } from "@/lib/agent/types";

export type LocalizationMethod = "none" | "gemini" | "deepseek" | "template";

/** Translate text into `lang` preserving all numbers. Returns null on failure. */
export async function geminiTranslate(text: string, lang: LangCode): Promise<string | null> {
  if (lang === "en-US") return text;
  const name = getLanguage(lang).englishName;
  const prompt =
    `Translate the following football prediction text into ${name}. ` +
    `Keep EVERY number, percentage, score and team name EXACTLY as written — do not change, ` +
    `round, or localize any digits or team names. Preserve line breaks and any **bold** markers. ` +
    `Return ONLY the translation, with no preamble.\n\n${text}`;
  const out = await geminiGenerate(prompt, { maxTokens: 600 });
  return out && out.length > 5 ? out : null;
}

/**
 * Localize a narrative string. en → unchanged. Cost-aware: routine localization
 * prefers DeepSeek (low cost); complex queries pass `preferGemini` to use the
 * premium provider. Either way falls back across providers, then to the English
 * text ("template" method). Numbers are preserved by the prompt either way.
 */
export async function localizeText(
  text: string,
  lang: LangCode,
  opts: { preferGemini?: boolean } = {}
): Promise<{ text: string; method: LocalizationMethod }> {
  if (lang === "en-US") return { text, method: "none" };
  const englishName = getLanguage(lang).englishName;

  if (opts.preferGemini && geminiConfigured()) {
    const out = await geminiTranslate(text, lang);
    if (out) return { text: out, method: "gemini" };
  }
  if (llmConfigured()) {
    const out = await llmTranslate(text, englishName);
    if (out) return { text: out, method: "deepseek" };
  }
  if (geminiConfigured()) {
    const out = await geminiTranslate(text, lang);
    if (out) return { text: out, method: "gemini" };
  }
  return { text, method: "template" };
}

const PCT = (x: number) => `${Math.round(x * 100)}%`;

const DRAW: Record<LangCode, string> = {
  "en-US": "Draw",
  "zh-CN": "平局",
  "es-ES": "Empate",
  "pt-BR": "Empate",
  "ja-JP": "引き分け",
};

const FAVORITE_LABEL: Record<LangCode, string> = {
  "en-US": "Favourite",
  "zh-CN": "更被看好",
  "es-ES": "Favorito",
  "pt-BR": "Favorito",
  "ja-JP": "優勢",
};

const TOO_CLOSE: Record<LangCode, string> = {
  "en-US": "Too close to call",
  "zh-CN": "势均力敌",
  "es-ES": "Muy parejo",
  "pt-BR": "Muito equilibrado",
  "ja-JP": "互角",
};

const FORECAST: Record<LangCode, string> = {
  "en-US": "Forecast",
  "zh-CN": "预测",
  "es-ES": "Pronóstico",
  "pt-BR": "Previsão",
  "ja-JP": "予測",
};

const TITLE_PICK: Record<LangCode, string> = {
  "en-US": "Top title contender",
  "zh-CN": "夺冠热门",
  "es-ES": "Máximo candidato al título",
  "pt-BR": "Maior candidato ao título",
  "ja-JP": "優勝候補の本命",
};

/**
 * Deterministic, in-language one-line result summary for a match. Built from the
 * structured numbers (team names kept as-is to avoid mistranslating proper nouns).
 */
export function buildMatchSummary(result: PredictionResult, lang: LangCode): string {
  const a = result.teamA;
  const b = result.teamB;
  const fav =
    result.favorite === "Too close to call" ? TOO_CLOSE[lang] : result.favorite;
  return (
    `${FORECAST[lang]}: ${a.flag} ${a.name} ${PCT(result.teamAWin)} · ` +
    `${DRAW[lang]} ${PCT(result.draw)} · ${b.flag} ${b.name} ${PCT(result.teamBWin)}. ` +
    `${FAVORITE_LABEL[lang]}: ${fav}.`
  );
}

/** Deterministic, in-language one-line summary for tournament-winner odds. */
export function buildChampionSummary(champions: ChampionAnswer, lang: LangCode): string {
  const top = champions.contenders[0];
  if (!top) return "";
  return `${TITLE_PICK[lang]}: ${top.flag} ${top.name} ${(top.champion * 100).toFixed(1)}%.`;
}
