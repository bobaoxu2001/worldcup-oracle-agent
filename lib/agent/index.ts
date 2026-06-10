/**
 * Agent orchestrator — the brain that runs the pipeline:
 *
 *   User Query
 *     → Planner                 (classify intent, name the plan)
 *     → Match Resolver          (free text → team slugs)
 *     → Daily News Resolver     (recent injuries / squad / tactics news)
 *     → Injury/Squad Analyzer   (lightweight, capped probability nudge)
 *     → Prediction Engine       (Elo + Dixon-Coles closed form)
 *     → Monte Carlo             (10,000 simulated matches)
 *     → Explanation Gen         (plain-English + fan insight + TikTok)
 *     → MongoDB Memory          (persist, with in-memory fallback)
 *     → Final Answer
 *
 * Returns a fully-formed AgentResponse the UI renders as a reasoning timeline,
 * a prediction card, a simulation summary, and a narrative. Every numeric
 * output is deterministic; Gemini (optional) only restyles the prose.
 */

import { predictMatch, getChampionProbabilities } from "@/lib/prediction-engine";
import { planQuery } from "./planner";
import { teamRef, resolveTeams } from "./matchResolver";
import { runSimulation } from "./simulator";
import { resolveScenario } from "./scenario";
import {
  buildExplanation,
  buildFanInsight,
  buildTiktokScript,
  buildChampionExplanation,
  polishWithGemini,
} from "./explanationGenerator";
import { savePrediction } from "@/lib/db/mongodb";
import { geminiConfigured } from "@/lib/llm/gemini";
import { resolveNews, resolveTeamNews } from "./newsResolver";
import { activeNewsProviderName } from "@/lib/news/newsIngestor";
import {
  localizeText,
  buildMatchSummary,
  buildChampionSummary,
} from "@/lib/i18n/responseLocalizer";
import { isLangCode, type LangCode } from "@/lib/i18n/languages";
import {
  classifyIntentWithLLM,
  generateAnalystNarrative,
  generateClarification,
  llmConfigured,
} from "@/lib/llm/provider";
import { explainRules } from "./rulesExplain";
import {
  buildGroupQualification,
  buildPathAnalysis,
  buildTeamAnalysis,
  buildTeamComparison,
  buildModelExplanation,
} from "./analysis";
import { groupOf } from "@/lib/seed/world-cup-2026-groups";
import {
  analyzeNewsImpact,
  buildNewsNarrative,
  buildTeamNewsDigest,
  summarizeTeam,
} from "./impactAnalyzer";
import type {
  AgentResponse,
  PredictionBundle,
  PredictionResult,
  ReasoningStep,
  ChampionAnswer,
  NewsImpactReport,
  StructuredResult,
} from "./types";

export interface AgentInput {
  query: string;
  isFollowUp?: boolean;
  /** Slugs of the matchup the follow-up refers to (from the prior turn). */
  contextTeams?: string[];
  /** Disable persistence (e.g. internal preview). */
  persist?: boolean;
  /** Global Voice Mode: language to localize the answer to (BCP-47). */
  language?: string;
}

function step(
  id: string,
  title: string,
  description: string,
  detail?: string
): ReasoningStep {
  return { id, title, status: "completed", description, detail };
}

/**
 * Narrate a structured result with the optional LLM (EN/zh), else fall back to
 * the deterministic text (translated for non-English when a translator exists).
 * The structured result is the LLM's ONLY source of truth — it may rephrase,
 * never invent.
 */
async function narrateOrFallback(
  structured: StructuredResult,
  deterministic: string,
  lang: LangCode
): Promise<{ text: string; enhanced: boolean }> {
  if ((lang === "en-US" || lang === "zh-CN") && llmConfigured()) {
    const out = await generateAnalystNarrative(structured, lang === "zh-CN" ? "zh" : "en");
    if (out) return { text: out, enhanced: true };
  }
  if (lang !== "en-US") {
    const r = await localizeText(deterministic, lang);
    return { text: r.text, enhanced: r.method === "gemini" };
  }
  return { text: deterministic, enhanced: false };
}

/** Build the normalized StructuredResult shell shared by the new intents. */
function makeStructured(
  base: Partial<StructuredResult> & Pick<StructuredResult, "intentType" | "query" | "summary">
): StructuredResult {
  return {
    language: "en",
    teams: [],
    group: null,
    stage: null,
    probabilities: null,
    rankings: null,
    modelFactors: [],
    rulesApplied: [],
    newsSignals: [],
    limitations: [],
    confidence: 50,
    ...base,
  };
}

function toPredictionResult(b: PredictionBundle): PredictionResult {
  const { prediction: p, teamA, teamB, simulation: sim } = b;
  const favIsA = p.teamAWinProbability > p.teamBWinProbability;
  const close = Math.abs(p.teamAWinProbability - p.teamBWinProbability) < 0.05;
  return {
    teamA,
    teamB,
    teamAWin: p.teamAWinProbability,
    draw: p.drawProbability,
    teamBWin: p.teamBWinProbability,
    confidenceLevel: p.confidenceLevel,
    confidenceScore: p.confidenceScore,
    mostLikelyScore: sim.mostLikelyScore.replace("-", "–"),
    upsetProbability: sim.upsetProbability,
    expectedScore: p.expectedScore,
    favorite: close ? "Too close to call" : favIsA ? teamA.name : teamB.name,
    keyFactors: p.factors.map((f) => ({
      label: f.label,
      detail: f.detail,
      weight: f.weight,
    })),
  };
}

/**
 * Finalize the narrative for the chosen language.
 * - English: the existing Gemini polish (English path is byte-identical to before).
 * - Other language: Gemini-translate preserving numbers, or keep English on
 *   fallback (the in-language result summary carries the localized headline).
 */
async function finalizeNarrative(
  english: string,
  context: string,
  lang: LangCode
): Promise<{ text: string; enhanced: boolean; method: "none" | "gemini" | "template" }> {
  if (lang === "en-US") {
    const r = await polishWithGemini(english, context);
    return { text: r.text, enhanced: r.enhanced, method: r.enhanced ? "gemini" : "none" };
  }
  const r = await localizeText(english, lang);
  return { text: r.text, enhanced: r.method === "gemini", method: r.method };
}

export async function runAgent(input: AgentInput): Promise<AgentResponse> {
  const { query } = input;
  const persist = input.persist ?? true;
  const hasContextMatchup = input.contextTeams?.length === 2;
  const plan = planQuery(query, input.isFollowUp, hasContextMatchup);
  const createdAt = new Date();
  const lang: LangCode = isLangCode(input.language) ? input.language : "en-US";

  // ---- Optional LLM intent refinement (deterministic stays source of truth) --
  // Only when the deterministic parser is unsure AND a provider is configured.
  // The LLM only relabels intent; every number, news item and ruling remains
  // deterministic. Any failure/missing key falls back to the deterministic guess.
  if (plan.intent === "unknown" && llmConfigured()) {
    const llm = await classifyIntentWithLLM(query, plan.intent);
    if (llm) {
      // Backfill anchors from the LLM's labels (resolved through OUR resolver —
      // the LLM only suggests names; the deterministic resolver validates them).
      if (plan.teamSlugs.length === 0 && llm.teams.length > 0) {
        plan.teamSlugs = resolveTeams(llm.teams.join(" vs ")).map((t) => t.slug);
      }
      if (!plan.group && llm.group) plan.group = llm.group;

      const n = plan.teamSlugs.length;
      switch (llm.intentType) {
        case "TOURNAMENT_FORECAST":
          plan.intent = "champion-odds";
          break;
        case "RULES_EXPLANATION":
          plan.intent = "rules-explanation";
          break;
        case "GROUP_QUALIFICATION":
          if (plan.group || n >= 1) plan.intent = "group-qualification";
          else plan.intent = "rules-explanation"; // generic third-place question
          break;
        case "PATH_ANALYSIS":
          if (n >= 1) plan.intent = "path-analysis";
          break;
        case "TEAM_ANALYSIS":
          if (n >= 1) plan.intent = "team-analysis";
          break;
        case "TEAM_COMPARISON":
          if (n === 2) plan.intent = "team-comparison";
          else if (n === 1) plan.intent = "team-analysis";
          break;
        case "NEWS_OR_INJURY":
          if (n >= 1) plan.intent = "team-news";
          break;
        case "MATCH_PREDICTION":
          if (n === 2) plan.intent = "match-prediction";
          break;
        case "MODEL_EXPLANATION":
          plan.intent = "model-explanation";
          break;
        // CLARIFICATION → stays "unknown" (helpful fallback below).
      }
    }
  }

  // ---- RULES EXPLANATION ------------------------------------------------
  if (plan.intent === "rules-explanation") {
    const { topic, explanation, fanInsight } = explainRules(query, lang);
    const steps: ReasoningStep[] = [
      step("identify", "Identify the rules question", `Detected a rules question (${topic}).`),
      step("locate", "Locate the 2026 rule", "Matched the relevant 2026 World Cup competition rule."),
      step("explain", "Explain in plain language", "Summarized the rule with examples."),
    ];
    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: [],
          prediction: null,
          simulationResult: null,
          reasoningSteps: steps.map((s) => s.title),
          explanation,
          followUpContext: `rules:${topic}`,
          createdAt,
        })
      : "none";
    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      explanation,
      fanInsight,
      llmEnhanced: false,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  // ---- MODEL EXPLANATION ------------------------------------------------
  if (plan.intent === "model-explanation") {
    const m = buildModelExplanation();
    const structured = makeStructured({
      intentType: "MODEL_EXPLANATION",
      query,
      language: lang === "zh-CN" ? "zh" : "en",
      summary: m.summary,
      modelFactors: m.factors,
      rulesApplied: m.rulesApplied,
      limitations: m.limitations,
      confidence: m.confidence,
    });
    const steps = plan.planLabels.map((t, i) => step(`model-${i}`, t, "Done."));
    const { text, enhanced } = await narrateOrFallback(structured, m.explanation, lang);
    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: [],
          prediction: null,
          simulationResult: null,
          reasoningSteps: steps.map((s) => s.title),
          explanation: text,
          followUpContext: "",
          createdAt,
          language: lang,
          summary: m.summary,
          modelFactors: m.factors,
          rulesApplied: m.rulesApplied,
          limitations: m.limitations,
          confidence: m.confidence,
        })
      : "none";
    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      structured,
      explanation: text,
      fanInsight: "🔍 Deterministic engine + capped news layer + MongoDB memory — the LLM only narrates, never invents numbers.",
      llmEnhanced: enhanced,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  // ---- GROUP QUALIFICATION ----------------------------------------------
  if (plan.intent === "group-qualification") {
    const focusSlug = plan.teamSlugs[0];
    const groupName = plan.group ?? (focusSlug ? groupOf(focusSlug).name : undefined);
    if (groupName) {
      const g = buildGroupQualification(groupName, focusSlug);
      const structured = makeStructured({
        intentType: "GROUP_QUALIFICATION",
        query,
        language: lang === "zh-CN" ? "zh" : "en",
        teams: focusSlug ? [focusSlug] : [],
        group: groupName,
        summary: g.summary,
        rankings: g.rankings,
        modelFactors: g.factors,
        rulesApplied: g.rulesApplied,
        limitations: g.limitations,
        confidence: g.confidence,
      });
      const steps = plan.planLabels.map((t, i) =>
        step(`gq-${i}`, t, i === 0 ? `Group ${groupName}${focusSlug ? ` · focus ${teamRef(focusSlug).name}` : ""}.` : "Done.")
      );
      const { text, enhanced } = await narrateOrFallback(structured, g.explanation, lang);
      const persisted = persist
        ? await savePrediction({
            userQuery: query,
            intent: plan.intent,
            teams: focusSlug ? [focusSlug] : [],
            prediction: null,
            simulationResult: null,
            reasoningSteps: steps.map((s) => s.title),
            explanation: text,
            followUpContext: `group:${groupName}`,
            createdAt,
            language: lang,
            group: groupName,
            summary: g.summary,
            rankings: g.rankings,
            modelFactors: g.factors,
            rulesApplied: g.rulesApplied,
            limitations: g.limitations,
            confidence: g.confidence,
          })
        : "none";
      return {
        intent: plan.intent,
        query,
        reasoningSteps: steps,
        structured,
        groupTable: g.table,
        explanation: text,
        fanInsight: `🎟️ ${g.summary}`,
        llmEnhanced: enhanced,
        persisted,
        createdAt: createdAt.toISOString(),
        language: lang,
      };
    }
    // No group/team anchor → answer the generic third-place rule instead.
    plan.intent = "rules-explanation";
    const { topic, explanation, fanInsight } = explainRules(query || "third place", lang);
    return {
      intent: plan.intent,
      query,
      reasoningSteps: [step("rules", "Explain the qualification rule", `Topic: ${topic}.`)],
      explanation,
      fanInsight,
      llmEnhanced: false,
      persisted: "none",
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  // ---- PATH ANALYSIS ------------------------------------------------------
  if (plan.intent === "path-analysis" && plan.teamSlugs.length >= 1) {
    const team = teamRef(plan.teamSlugs[0]);
    const p = buildPathAnalysis(team);
    const structured = makeStructured({
      intentType: "PATH_ANALYSIS",
      query,
      language: lang === "zh-CN" ? "zh" : "en",
      teams: [team.slug],
      group: groupOf(team.slug).name,
      summary: p.summary,
      rankings: p.rankings,
      modelFactors: p.factors,
      rulesApplied: p.rulesApplied,
      limitations: p.limitations,
      confidence: p.confidence,
    });
    const steps = plan.planLabels.map((t, i) =>
      step(`path-${i}`, t, i === 0 ? `${team.name} · Group ${groupOf(team.slug).name}.` : "Done.")
    );
    const { text, enhanced } = await narrateOrFallback(structured, p.explanation, lang);
    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: [team.slug],
          prediction: null,
          simulationResult: null,
          reasoningSteps: steps.map((s) => s.title),
          explanation: text,
          followUpContext: `path:${team.slug}`,
          createdAt,
          language: lang,
          group: groupOf(team.slug).name,
          summary: p.summary,
          rankings: p.rankings,
          modelFactors: p.factors,
          rulesApplied: p.rulesApplied,
          limitations: p.limitations,
          confidence: p.confidence,
        })
      : "none";
    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      structured,
      explanation: text,
      fanInsight: `🗺️ ${p.summary}`,
      llmEnhanced: enhanced,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  // ---- TEAM ANALYSIS ------------------------------------------------------
  if (plan.intent === "team-analysis" && plan.teamSlugs.length >= 1) {
    const team = teamRef(plan.teamSlugs[0]);
    const { resolved } = await resolveTeamNews(team, 4);
    const a = buildTeamAnalysis(team, resolved.items);
    const structured = makeStructured({
      intentType: "TEAM_ANALYSIS",
      query,
      language: lang === "zh-CN" ? "zh" : "en",
      teams: [team.slug],
      group: groupOf(team.slug).name,
      summary: a.summary,
      modelFactors: a.factors,
      newsSignals: resolved.items.slice(0, 3).map((n) => `${n.impactLevel}-impact ${n.category}: ${n.title}${n.demo ? " (demo)" : ""}`),
      limitations: a.limitations,
      confidence: a.confidence,
    });
    const steps = plan.planLabels.map((t, i) =>
      step(`ta-${i}`, t, i === 0 ? `${team.flag} ${team.name}.` : "Done.")
    );
    const { text, enhanced } = await narrateOrFallback(structured, a.explanation, lang);
    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: [team.slug],
          prediction: null,
          simulationResult: null,
          reasoningSteps: steps.map((s) => s.title),
          explanation: text,
          followUpContext: `team:${team.slug}`,
          createdAt,
          language: lang,
          summary: a.summary,
          modelFactors: a.factors,
          newsSignals: structured.newsSignals,
          limitations: a.limitations,
          confidence: a.confidence,
        })
      : "none";
    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      structured,
      explanation: text,
      fanInsight: `📊 ${a.summary}`,
      llmEnhanced: enhanced,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  // ---- TEAM COMPARISON ----------------------------------------------------
  if (plan.intent === "team-comparison" && plan.teamSlugs.length === 2) {
    const a = teamRef(plan.teamSlugs[0]);
    const b = teamRef(plan.teamSlugs[1]);
    const c = buildTeamComparison(a, b);
    const structured = makeStructured({
      intentType: "TEAM_COMPARISON",
      query,
      language: lang === "zh-CN" ? "zh" : "en",
      teams: [a.slug, b.slug],
      summary: c.summary,
      probabilities: c.probabilities,
      modelFactors: c.factors,
      limitations: c.limitations,
      confidence: c.confidence,
    });
    const steps = plan.planLabels.map((t, i) =>
      step(`tc-${i}`, t, i === 0 ? `${a.flag} ${a.name} vs ${b.flag} ${b.name}.` : "Done.")
    );
    const { text, enhanced } = await narrateOrFallback(structured, c.explanation, lang);
    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: [a.slug, b.slug],
          prediction: null,
          simulationResult: null,
          reasoningSteps: steps.map((s) => s.title),
          explanation: text,
          followUpContext: `compare:${a.slug}-${b.slug}`,
          createdAt,
          language: lang,
          summary: c.summary,
          modelFactors: c.factors,
          limitations: c.limitations,
          confidence: c.confidence,
        })
      : "none";
    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      structured,
      explanation: text,
      fanInsight: `⚖️ ${c.summary}`,
      llmEnhanced: enhanced,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  // ---- TEAM NEWS DIGEST -------------------------------------------------
  if (plan.intent === "team-news" && plan.teamSlugs.length >= 1) {
    const team = teamRef(plan.teamSlugs[0]);
    const { resolved, source } = await resolveTeamNews(team, 8);
    const view = summarizeTeam(resolved);

    const steps: ReasoningStep[] = [
      step("identify", "Identify the team", `Focused on ${team.name} ${team.flag}.`),
      step(
        "news",
        "Pull the latest team news",
        `Loaded ${resolved.items.length} recent item${resolved.items.length === 1 ? "" : "s"} for ${team.name}.`,
        source === "demo"
          ? "Source: curated demo signals (no live news API key configured)."
          : "Source: live news API."
      ),
      step("classify", "Classify each item", "Tagged category, impact level and direction for each item."),
      step("summary", "Summarize for the team", view.headline),
    ];

    const digest = buildTeamNewsDigest(view, source);
    const { text, enhanced, method } = await finalizeNarrative(
      digest,
      `Latest team-news digest for ${team.name}. Keep facts and any 'demo data' caveat intact.`,
      lang
    );

    const topNeg = view.items.find((i) => i.direction === "negative");
    const fanInsightEn = topNeg
      ? `📰 ${team.flag} ${team.name}: ${topNeg.impactLevel}-impact ${topNeg.category} update is the one to watch before kickoff.`
      : `📰 ${team.flag} ${team.name} look settled — no major negative news in the latest signals.`;
    const fanInsight = lang === "en-US" ? fanInsightEn : (await localizeText(fanInsightEn, lang)).text;

    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: [team.slug],
          prediction: null,
          simulationResult: null,
          reasoningSteps: steps.map((s) => s.title),
          explanation: text,
          followUpContext: `team-news:${team.slug}`,
          createdAt,
        })
      : "none";

    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      teamNews: view,
      explanation: text,
      fanInsight,
      newsSource: source,
      newsProvider: activeNewsProviderName(),
      llmEnhanced: enhanced,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
      localizationMethod: method,
    };
  }

  // ---- CHAMPION ODDS ----------------------------------------------------
  if (plan.intent === "champion-odds" && plan.teamSlugs.length < 2) {
    const champions = getChampionProbabilities();
    const focusSlug = plan.teamSlugs[0];
    const answer: ChampionAnswer = {
      simulationsRun: 10000,
      contenders: champions.slice(0, 8).map((c) => ({
        slug: c.slug,
        name: c.name,
        flag: c.flag,
        champion: c.champion,
        elo: c.elo,
      })),
    };

    const steps: ReasoningStep[] = [
      step("plan", "Plan the analysis", `Intent: tournament-winner question. ${plan.planLabels[0]}.`),
      step(
        "data",
        "Load team data",
        "Loaded all 48 qualified nations and their calibrated Elo ratings."
      ),
      step(
        "sim",
        "Run tournament Monte Carlo",
        "Simulated the full 48-team bracket 10,000 times (groups → best thirds → knockouts)."
      ),
      step("report", "Rank contenders", "Tallied title wins per nation and ranked the field."),
    ];

    let explanation = buildChampionExplanation(answer);
    const focus = focusSlug ? champions.find((c) => c.slug === focusSlug) : undefined;
    if (focus) {
      explanation =
        `${focus.flag} ${focus.name} win the 2026 World Cup in ${(focus.champion * 100).toFixed(
          1
        )}% of simulations (Elo ${focus.elo}).\n\n` + explanation;
    }

    const fanInsightEn = `🏆 ${answer.contenders[0].flag} ${answer.contenders[0].name} lead the title race at ${(
      answer.contenders[0].champion * 100
    ).toFixed(1)}% — but 10k sims say it's wide open.`;

    const { text, enhanced, method } = await finalizeNarrative(
      explanation,
      "Tournament title odds from a 10,000-run Monte Carlo simulation of the 2026 World Cup.",
      lang
    );
    const fanInsight = lang === "en-US" ? fanInsightEn : (await localizeText(fanInsightEn, lang)).text;
    const localizedSummary = lang === "en-US" ? undefined : buildChampionSummary(answer, lang);

    const persisted = persist
      ? await savePrediction({
          userQuery: query,
          intent: plan.intent,
          teams: focusSlug ? [focusSlug] : [],
          prediction: null,
          simulationResult: {
            simulationsRun: 10000,
            mostLikelyScore: `${answer.contenders[0].name} champions`,
            upsetProbability: 1 - answer.contenders[0].champion,
            summary: `${answer.contenders[0].name} most likely champions at ${(
              answer.contenders[0].champion * 100
            ).toFixed(1)}%.`,
          },
          reasoningSteps: steps.map((s) => s.title),
          explanation: text,
          followUpContext: "",
          createdAt,
        })
      : "none";

    return {
      intent: plan.intent,
      query,
      reasoningSteps: steps,
      champions: answer,
      explanation: text,
      fanInsight,
      llmEnhanced: enhanced,
      persisted,
      createdAt: createdAt.toISOString(),
      language: lang,
      localizedSummary,
      localizationMethod: method,
    };
  }

  // ---- MATCH / SCENARIO / TIKTOK ---------------------------------------
  // Resolve the two teams (fall back to the follow-up context if needed).
  let slugs = plan.teamSlugs;
  if (slugs.length < 2 && input.contextTeams && input.contextTeams.length === 2) {
    slugs = input.contextTeams;
  }

  if (slugs.length < 2) {
    // Could not find a matchup — return a helpful "unknown" response.
    const steps: ReasoningStep[] = [
      step("plan", "Parse the question", "Looked for two national teams or a tournament-level intent."),
      step(
        "data",
        "Resolve entities",
        slugs.length === 1
          ? `Found one team (${teamRef(slugs[0]).name}) but no opponent.`
          : "Could not confidently identify two teams."
      ),
    ];
    const examples = [
      "Match prediction: Who will win Argentina vs Germany?",
      "Tournament forecast: Who will win the 2026 World Cup?",
      "Group qualification: Which teams qualify from Group A?",
      "Team analysis: Is Argentina strong this year?",
      "News: Germany injury update",
      "Rules: How do yellow cards affect qualification?",
    ];
    const explanationEn =
      "I couldn't match that to one of my analyses yet. Here's what you can ask:\n\n• " +
      examples.join("\n• ");
    const fanEn = "Give me a matchup, a team, a group, or a rules question — I'll take it from there. ⚽";
    let explanation = explanationEn;
    if (llmConfigured()) {
      const c = await generateClarification(query, examples, lang === "zh-CN" ? "zh" : "en");
      if (c) explanation = c;
    }
    if (explanation === explanationEn && lang !== "en-US") {
      explanation = (await localizeText(explanationEn, lang)).text;
    }
    const fanInsight = lang === "en-US" ? fanEn : (await localizeText(fanEn, lang)).text;
    return {
      intent: "unknown",
      query,
      reasoningSteps: steps,
      explanation,
      fanInsight,
      llmEnhanced: false,
      persisted: "none",
      createdAt: createdAt.toISOString(),
      language: lang,
    };
  }

  const teamA = teamRef(slugs[0]);
  const teamB = teamRef(slugs[1]);

  // Scenario adjustment (only for follow-up what-ifs).
  const scenario =
    plan.intent === "scenario" ? resolveScenario(query, teamA, teamB) : null;
  const eloA = teamA.elo + (scenario?.eloDeltaA ?? 0);
  const eloB = teamB.elo + (scenario?.eloDeltaB ?? 0);

  const prediction = predictMatch(teamA.slug, teamB.slug, undefined, {
    eloOverrideA: scenario ? eloA : undefined,
    eloOverrideB: scenario ? eloB : undefined,
  });
  const simulation = runSimulation(teamA, teamB, {
    eloA: scenario ? eloA : undefined,
    eloB: scenario ? eloB : undefined,
  });

  const bundle: PredictionBundle = { prediction, teamA, teamB, simulation };
  const result = toPredictionResult(bundle);

  // ---- Daily News Resolver + Injury / Squad Impact Analyzer -------------
  // Load recent news for both teams and compute a capped, transparent nudge to
  // the headline probabilities. News is a lightweight signal layer on top of
  // the base simulation — never a replacement for it.
  const news = await resolveNews(teamA, teamB, 4);
  const newsImpact: NewsImpactReport = analyzeNewsImpact(news, {
    teamAWin: result.teamAWin,
    draw: result.draw,
    teamBWin: result.teamBWin,
  });
  if (newsImpact.adjustment.applied) {
    const adj = newsImpact.adjustment.adjusted;
    result.teamAWin = adj.teamAWin;
    result.draw = adj.draw;
    result.teamBWin = adj.teamBWin;
    const close = Math.abs(adj.teamAWin - adj.teamBWin) < 0.05;
    result.favorite = close
      ? "Too close to call"
      : adj.teamAWin > adj.teamBWin
        ? teamA.name
        : teamB.name;
  }

  const newsStepDesc = `Pulled ${news.teamA.items.length} ${teamA.name} + ${news.teamB.items.length} ${teamB.name} recent news item${
    news.teamA.items.length + news.teamB.items.length === 1 ? "" : "s"
  }.`;
  const newsSourceNote =
    news.source === "demo"
      ? "Source: curated demo signals (no live news API key configured)."
      : "Source: live news API.";

  // Build the visible reasoning timeline.
  const steps: ReasoningStep[] =
    plan.intent === "scenario"
      ? [
          step(
            "detect",
            "Detect the scenario change",
            scenario?.label ?? "Re-evaluating the prior matchup under new conditions.",
            scenario?.description
          ),
          step(
            "reweight",
            "Re-weight team strength",
            `Adjusted ratings: ${teamA.name} ${eloA}, ${teamB.name} ${eloB}.`
          ),
          step("news", "Re-check daily team news", newsStepDesc, newsSourceNote),
          step("impact", "Re-check injury / squad impact", newsImpact.note),
          step(
            "sim",
            "Re-run Monte Carlo simulation",
            `Re-simulated the matchup ${simulation.simulationsRun.toLocaleString()} times.`
          ),
          step("report", "Explain what changed", "Compared the new probabilities to the baseline."),
        ]
      : [
          step(
            "data",
            "Gather match data",
            `Identified ${teamA.name} ${teamA.flag} and ${teamB.name} ${teamB.flag} and loaded their team profiles.`
          ),
          step("news", "Resolve daily team news", newsStepDesc, newsSourceNote),
          step(
            "impact",
            "Analyze injury / squad impact",
            newsImpact.note,
            `${newsImpact.teamA.headline} ${newsImpact.teamB.headline}`
          ),
          step(
            "analyze",
            "Analyze team strength",
            `Compared Elo (${teamA.elo} vs ${teamB.elo}), host advantage, expected goals and draw likelihood.`
          ),
          step(
            "sim",
            "Run Monte Carlo simulation",
            `Simulated the matchup ${simulation.simulationsRun.toLocaleString()} times.`,
            `Most-likely scoreline ${result.mostLikelyScore}; upset probability ${(
              simulation.upsetProbability * 100
            ).toFixed(0)}%.`
          ),
          step(
            "report",
            "Generate prediction report",
            "Converted the simulation + news signals into a clear, fan-friendly prediction."
          ),
        ];

  // Narrative.
  let explanation = buildExplanation(bundle);
  if (scenario) {
    explanation = `**What changed:** ${scenario.description}\n\n${explanation}`;
  }
  explanation = `${explanation}\n\n${buildNewsNarrative(newsImpact)}`;
  let fanInsight = buildFanInsight(bundle);
  const tiktokScript =
    plan.intent === "tiktok-preview" ? buildTiktokScript(bundle) : undefined;

  const { text, enhanced, method } = await finalizeNarrative(
    explanation,
    `News-aware match prediction: ${teamA.name} vs ${teamB.name}.${
      scenario ? " This is a what-if scenario re-analysis." : ""
    } A capped news-signal layer adjusted the probabilities; keep all numbers and the 'demo data' caveat intact.`,
    lang
  );
  // In-language deterministic headline (also used for text-to-speech).
  const localizedSummary = lang === "en-US" ? undefined : buildMatchSummary(result, lang);
  if (lang !== "en-US") fanInsight = (await localizeText(fanInsight, lang)).text;

  const followUpContext = [scenario?.label, newsImpact.adjustment.applied ? newsImpact.note : ""]
    .filter(Boolean)
    .join(" · ");

  const persisted = persist
    ? await savePrediction({
        userQuery: query,
        intent: plan.intent,
        teams: [teamA.slug, teamB.slug],
        prediction: {
          teamAWin: result.teamAWin,
          draw: result.draw,
          teamBWin: result.teamBWin,
          confidence: result.confidenceScore,
        },
        simulationResult: {
          simulationsRun: simulation.simulationsRun,
          mostLikelyScore: result.mostLikelyScore,
          upsetProbability: simulation.upsetProbability,
          summary: simulation.summary,
        },
        reasoningSteps: steps.map((s) => s.title),
        explanation: text,
        followUpContext,
        createdAt,
      })
    : "none";

  return {
    intent: plan.intent,
    query,
    reasoningSteps: steps,
    prediction: result,
    simulation,
    newsImpact,
    newsSource: news.source,
    newsProvider: activeNewsProviderName(),
    explanation: text,
    fanInsight,
    tiktokScript,
    scenarioNote: scenario?.label,
    llmEnhanced: enhanced,
    persisted,
    createdAt: createdAt.toISOString(),
    language: lang,
    localizedSummary,
    localizationMethod: method,
  };
}

export { geminiConfigured };
export type { AgentResponse } from "./types";
