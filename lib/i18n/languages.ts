/**
 * Global Voice Mode — supported languages.
 *
 * The `code` is a BCP-47 tag used directly by the browser Web Speech APIs
 * (SpeechRecognition.lang and SpeechSynthesisUtterance.lang) AND as our internal
 * language key. Lightweight by design — no i18n framework.
 */

export type LangCode = "en-US" | "zh-CN" | "es-ES" | "pt-BR" | "ja-JP";

export interface Language {
  code: LangCode;
  /** Native label shown in the selector. */
  label: string;
  /** English name (used in Gemini translation prompts). */
  englishName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en-US", label: "English", englishName: "English", flag: "🇬🇧" },
  { code: "zh-CN", label: "中文", englishName: "Simplified Chinese", flag: "🇨🇳" },
  { code: "es-ES", label: "Español", englishName: "Spanish", flag: "🇪🇸" },
  { code: "pt-BR", label: "Português", englishName: "Brazilian Portuguese", flag: "🇧🇷" },
  { code: "ja-JP", label: "日本語", englishName: "Japanese", flag: "🇯🇵" },
];

export const DEFAULT_LANG: LangCode = "en-US";

const CODES = new Set(LANGUAGES.map((l) => l.code));

export function isLangCode(x: unknown): x is LangCode {
  return typeof x === "string" && CODES.has(x as LangCode);
}

export function getLanguage(code: LangCode): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
