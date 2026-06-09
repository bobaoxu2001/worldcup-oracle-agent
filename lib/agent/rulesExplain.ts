/**
 * Deterministic rules explanations (RULES_EXPLANATION intent).
 *
 * Plain-language summaries of the 2026 FIFA World Cup competition rules the agent
 * models. These are STATIC, deterministic text — no probabilities, no live data.
 *
 * Rule basis: FIFA World Cup 2026 format (48 teams · 12 groups of 4 · top 2 +
 * 8 best third-placed teams = 32 in the Round of 32). The World Cup applies
 * OVERALL goal difference / goals scored BEFORE head-to-head (unlike UEFA
 * competitions). Discipline thresholds (yellow-card accumulation / reset stage)
 * are CONFIGURABLE in the engine and should be confirmed against the official
 * 2026 regulations before being relied upon — they are not invented here.
 * See README → "2026 World Cup format accuracy".
 */

import type { LangCode } from "@/lib/i18n/languages";

export type RulesTopic = "third-place" | "discipline" | "tiebreakers" | "format";

const RE = {
  thirdPlace: /best.*third|third[- ]?place|3rd[- ]?place|8 of 12|小组第三|第三名/i,
  discipline: /yellow card|red card|booking|caution|suspen|accumulat|black card|纪律|黄牌|红牌|停赛/i,
  tiebreak: /tie[- ]?break|tiebreaker|tie on points|level on points|same points|equal points|standings|平分|并列|相同积分|排名规则/i,
  format: /format|how many teams|how many groups|how does the (world cup|tournament) work|赛制|规则/i,
};

/** Does this query look like a rules question (no specific 2-team matchup)? */
export function looksLikeRulesQuestion(query: string): boolean {
  return (
    RE.thirdPlace.test(query) ||
    RE.discipline.test(query) ||
    RE.tiebreak.test(query) ||
    RE.format.test(query)
  );
}

export function detectRulesTopic(query: string): RulesTopic {
  if (RE.thirdPlace.test(query)) return "third-place";
  if (RE.discipline.test(query)) return "discipline";
  if (RE.tiebreak.test(query)) return "tiebreakers";
  return "format";
}

// Phase A ships EN + 中文 rule copy; other languages fall back to English.
const isZh = (lang: LangCode) => lang === "zh-CN";

const EN: Record<RulesTopic, { explanation: string; fan: string }> = {
  "third-place": {
    explanation:
      "**How the 8 best third-placed teams advance (2026 format).**\n\n" +
      "• 48 teams play in 12 groups of 4. The top 2 of every group advance automatically — that's 24 teams.\n" +
      "• The **8 best third-placed teams** (out of the 12 group thirds) also advance, making **32 teams** in the Round of 32.\n" +
      "• The 12 third-placed teams are ranked across groups by: 1) points, 2) goal difference, 3) goals scored, 4) (modeled) fair-play / disciplinary points, 5) FIFA ranking as a final fallback.\n" +
      "• The top 8 qualify; the bottom 4 are eliminated.\n\n" +
      "This agent's tournament simulator already applies this — and its bracket routing is validated across all 495 possible third-place combinations (`npm run validate:bracket`).",
    fan: "8 of the 12 group third-placed teams sneak through — being a strong third can still get you to the knockouts. 🎟️",
  },
  discipline: {
    explanation:
      "**How yellow & red cards affect qualification.**\n\n" +
      "Cards matter in two ways:\n" +
      "• **Group tie-breaker:** fair-play / team-conduct points are a tie-breaker *after* points, goal difference and goals scored. This agent models conduct as: yellow −1, indirect red −3, direct red −4, yellow + direct red −5 (configurable constants).\n" +
      "• **Player suspensions:** a straight red card means an automatic suspension (at least the next match), and accumulated yellow cards across matches trigger a one-match suspension once a threshold is reached.\n\n" +
      "_Note: the exact 2026 yellow-card accumulation threshold and the stage at which yellows are wiped are **configurable** in the engine and should be confirmed against the official FIFA 2026 regulations — they are not invented here._",
    fan: "Two yellows = you sit out the next one. Discipline can quietly decide a tight group. 🟡🟡",
  },
  tiebreakers: {
    explanation:
      "**2026 World Cup group tie-breakers (in order).**\n\n" +
      "1. Points in all group matches\n2. Goal difference in all group matches\n3. Goals scored in all group matches\n\n" +
      "If teams are still level, **head-to-head** among the tied teams applies: 4) head-to-head points → 5) head-to-head goal difference → 6) head-to-head goals scored (re-applied among any still-tied teams). Remaining ties go to 7) fair-play / conduct points, then 8) FIFA ranking / drawing of lots.\n\n" +
      "_Important: the World Cup applies **overall** goal difference and goals **before** head-to-head — this differs from UEFA competitions (Euros), which use head-to-head first._",
    fan: "At the World Cup, overall goal difference comes before head-to-head — the opposite of the Euros. 📊",
  },
  format: {
    explanation:
      "**2026 World Cup format.**\n\n" +
      "• 48 teams · 12 groups of 4 · each team plays 3 group matches (3 pts win, 1 draw, 0 loss).\n" +
      "• Top 2 of each group + the 8 best third-placed teams = **32 teams** into the knockouts.\n" +
      "• Knockouts: Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Third-place match → Final.\n\n" +
      "Ask me about **best third-placed teams**, **tie-breakers**, or **yellow cards** for the details — or ask for a **tournament forecast** or a **specific matchup**.",
    fan: "48 teams, 12 groups, 104 matches — the biggest World Cup ever. 🌍",
  },
};

const ZH: Record<RulesTopic, { explanation: string; fan: string }> = {
  "third-place": {
    explanation:
      "**8 个最佳小组第三如何晋级（2026 赛制）。**\n\n" +
      "• 48 支球队分为 12 个小组、每组 4 队。每组前 2 名直接晋级——共 24 队。\n" +
      "• 12 个小组第三名中成绩最好的 **8 个**也会晋级，凑成 **32 强**淘汰赛。\n" +
      "• 12 个小组第三名按以下顺序排名：1) 积分，2) 净胜球，3) 进球数，4)（模型）公平竞赛/纪律分，5) 最后以国际足联排名兜底。\n" +
      "• 前 8 名晋级，后 4 名淘汰。\n\n" +
      "本智能体的赛事模拟器已实现该规则，并对全部 495 种第三名组合做了校验（`npm run validate:bracket`）。",
    fan: "12 个小组第三里有 8 个能晋级——当个强力的小组第三也能进淘汰赛。🎟️",
  },
  discipline: {
    explanation:
      "**黄牌与红牌如何影响晋级。**\n\n" +
      "卡牌主要影响两方面：\n" +
      "• **小组并列打破项：** 公平竞赛/纪律分在积分、净胜球、进球数之后作为并列打破项。本模型记分为：黄牌 −1、间接红牌 −3、直接红牌 −4、黄牌+直接红牌 −5（可配置）。\n" +
      "• **球员停赛：** 直接红牌通常自动停赛（至少下一场）；累计黄牌达到阈值会触发停赛一场。\n\n" +
      "_注意：2026 年具体的累计黄牌阈值与黄牌清零阶段在引擎中**可配置**，使用前应对照官方规则确认——本应用不会臆造这些数值。_",
    fan: "两张黄牌就要停赛一场，纪律有时会悄悄决定一个小组。🟡🟡",
  },
  tiebreakers: {
    explanation:
      "**2026 世界杯小组排名并列规则（顺序）。**\n\n" +
      "1. 全部小组赛积分\n2. 全部比赛净胜球\n3. 全部比赛进球数\n\n" +
      "若仍并列，则看并列球队之间的**相互交锋**：4) 交锋积分 → 5) 交锋净胜球 → 6) 交锋进球（并在仍并列的球队之间再次套用）。之后看 7) 公平竞赛分，最后 8) 国际足联排名/抽签。\n\n" +
      "_重点：世界杯是先看**总**净胜球和总进球，再看相互交锋——这与欧洲杯（先看相互交锋）不同。_",
    fan: "世界杯先比总净胜球再比相互交锋，和欧洲杯正好相反。📊",
  },
  format: {
    explanation:
      "**2026 世界杯赛制。**\n\n" +
      "• 48 支球队 · 12 个小组、每组 4 队 · 每队踢 3 场小组赛（胜 3 分、平 1 分、负 0 分）。\n" +
      "• 每组前 2 名 + 8 个最佳小组第三 = **32 队**进入淘汰赛。\n" +
      "• 淘汰赛：32 强 → 16 强 → 1/4 决赛 → 半决赛 → 三四名决赛 → 决赛。\n\n" +
      "你可以继续问**最佳小组第三**、**并列规则**或**黄牌**的细节——也可以让我做**夺冠预测**或**具体对阵预测**。",
    fan: "48 队、12 个小组、104 场比赛——史上最大规模的世界杯。🌍",
  },
};

export function explainRules(
  query: string,
  lang: LangCode
): { topic: RulesTopic; explanation: string; fanInsight: string } {
  const topic = detectRulesTopic(query);
  const table = isZh(lang) ? ZH : EN;
  return { topic, explanation: table[topic].explanation, fanInsight: table[topic].fan };
}
