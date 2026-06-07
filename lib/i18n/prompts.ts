/**
 * Localized suggested prompts + UI strings for Global Voice Mode.
 *
 * Each suggested prompt has a localized `display` (what the fan sees / hears) and
 * an English `query` (what we send to the agent). The agent's planner and team
 * resolver are English-keyword based, so submitting the English canonical query
 * keeps team resolution and intent detection 100% reliable in every language,
 * while the response is localized back. (Free typed/voice input in another
 * language also resolves — localized team aliases are added in matchResolver.)
 */

import type { LangCode } from "./languages";

export interface SuggestedPrompt {
  display: string;
  query: string; // English canonical sent to the agent
}

const FLAGSHIP = "Who will win Argentina vs Germany based on the latest team news?";
const CHAMPION = "Which team has the best chance to win the 2026 World Cup?";
const TEAM_NEWS = "Show me the latest Argentina team news before predicting";
const FRA_POR = "Predict France vs Portugal and include news impact";

export const SUGGESTED_PROMPTS: Record<LangCode, SuggestedPrompt[]> = {
  "en-US": [
    { display: FLAGSHIP, query: FLAGSHIP },
    { display: FRA_POR, query: FRA_POR },
    { display: TEAM_NEWS, query: TEAM_NEWS },
    { display: CHAMPION, query: CHAMPION },
  ],
  "zh-CN": [
    { display: "根据最新球队新闻，阿根廷和德国谁更有机会赢？", query: FLAGSHIP },
    { display: "预测法国对葡萄牙，并加入新闻影响", query: FRA_POR },
    { display: "预测前先看看阿根廷的最新球队新闻", query: TEAM_NEWS },
    { display: "哪支球队最有可能赢得 2026 世界杯？", query: CHAMPION },
  ],
  "es-ES": [
    {
      display:
        "¿Quién ganará entre Argentina y Alemania según las últimas noticias del equipo?",
      query: FLAGSHIP,
    },
    { display: "Predice Francia vs Portugal e incluye el impacto de las noticias", query: FRA_POR },
    { display: "Muéstrame las últimas noticias de Argentina antes de predecir", query: TEAM_NEWS },
    { display: "¿Qué selección tiene más opciones de ganar el Mundial 2026?", query: CHAMPION },
  ],
  "pt-BR": [
    {
      display: "Quem vence Argentina x Alemanha com base nas últimas notícias das seleções?",
      query: FLAGSHIP,
    },
    { display: "Preveja França x Portugal e inclua o impacto das notícias", query: FRA_POR },
    { display: "Mostre as últimas notícias da Argentina antes de prever", query: TEAM_NEWS },
    { display: "Qual seleção tem a melhor chance de ganhar a Copa de 2026?", query: CHAMPION },
  ],
  "ja-JP": [
    {
      display: "最新のチームニュースを踏まえると、アルゼンチン対ドイツはどちらが勝ちますか？",
      query: FLAGSHIP,
    },
    { display: "フランス対ポルトガルを予測し、ニュースの影響も含めて", query: FRA_POR },
    { display: "予測の前にアルゼンチンの最新チームニュースを見せて", query: TEAM_NEWS },
    { display: "2026年ワールドカップで優勝の可能性が最も高いのはどの国？", query: CHAMPION },
  ],
};

/** Short UI strings. Keys fall back to English when a language is missing one. */
type StringKey =
  | "placeholder"
  | "why"
  | "fanInsight"
  | "followUp"
  | "voiceHelper"
  | "listening"
  | "voiceUnsupported"
  | "micDenied"
  | "voiceError"
  | "listen"
  | "stop"
  | "language"
  | "resultHeading";

export const UI_STRINGS: Record<LangCode, Record<StringKey, string>> = {
  "en-US": {
    placeholder: "Ask: Who will win Argentina vs Germany?",
    why: "Why?",
    fanInsight: "Fan insight",
    followUp: "Ask a follow-up",
    voiceHelper: "Ask by voice, get predictions in your language.",
    listening: "Listening…",
    voiceUnsupported: "Voice input isn't supported in this browser.",
    micDenied: "Microphone permission denied.",
    voiceError: "Voice input failed — please type instead.",
    listen: "Listen",
    stop: "Stop",
    language: "Language",
    resultHeading: "Result",
  },
  "zh-CN": {
    placeholder: "提问：阿根廷对德国谁会赢？",
    why: "为什么？",
    fanInsight: "球迷视角",
    followUp: "追问",
    voiceHelper: "用语音提问，用你的语言获取预测。",
    listening: "正在聆听…",
    voiceUnsupported: "此浏览器不支持语音输入。",
    micDenied: "麦克风权限被拒绝。",
    voiceError: "语音输入失败，请改用文字。",
    listen: "朗读",
    stop: "停止",
    language: "语言",
    resultHeading: "预测结果",
  },
  "es-ES": {
    placeholder: "Pregunta: ¿Quién gana Argentina vs Alemania?",
    why: "¿Por qué?",
    fanInsight: "Visión del aficionado",
    followUp: "Haz una pregunta de seguimiento",
    voiceHelper: "Pregunta por voz y recibe predicciones en tu idioma.",
    listening: "Escuchando…",
    voiceUnsupported: "La entrada de voz no es compatible con este navegador.",
    micDenied: "Permiso de micrófono denegado.",
    voiceError: "La entrada de voz falló: escribe en su lugar.",
    listen: "Escuchar",
    stop: "Detener",
    language: "Idioma",
    resultHeading: "Resultado",
  },
  "pt-BR": {
    placeholder: "Pergunte: Quem vence Argentina x Alemanha?",
    why: "Por quê?",
    fanInsight: "Visão do torcedor",
    followUp: "Faça uma pergunta de acompanhamento",
    voiceHelper: "Pergunte por voz e receba previsões no seu idioma.",
    listening: "Ouvindo…",
    voiceUnsupported: "Entrada de voz não suportada neste navegador.",
    micDenied: "Permissão de microfone negada.",
    voiceError: "A entrada de voz falhou — digite em vez disso.",
    listen: "Ouvir",
    stop: "Parar",
    language: "Idioma",
    resultHeading: "Resultado",
  },
  "ja-JP": {
    placeholder: "質問：アルゼンチン対ドイツ、どちらが勝つ？",
    why: "なぜ？",
    fanInsight: "ファン目線",
    followUp: "追加で質問する",
    voiceHelper: "音声で質問して、あなたの言語で予測を受け取ろう。",
    listening: "聞き取り中…",
    voiceUnsupported: "このブラウザは音声入力に対応していません。",
    micDenied: "マイクの使用が拒否されました。",
    voiceError: "音声入力に失敗しました。テキストで入力してください。",
    listen: "再生",
    stop: "停止",
    language: "言語",
    resultHeading: "予測結果",
  },
};

export function t(lang: LangCode, key: StringKey): string {
  return UI_STRINGS[lang]?.[key] ?? UI_STRINGS["en-US"][key];
}
