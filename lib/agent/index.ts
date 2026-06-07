/**
 * Agent orchestrator — the brain that runs the pipeline:
 *
 *   User Query
 *     → Planner            (classify intent, name the plan)
 *     → Match Resolver     (free text → team slugs)
 *     → Prediction Engine  (Elo + Dixon-Coles closed form)
 *     → Monte Carlo        (10,000 simulated matches)
 *     → Explanation Gen    (plain-English + fan insight + TikTok)
 *     → MongoDB Memory     (persist, with in-memory fallback)
 *     → Final Answer
 *
 * Returns a fully-formed AgentResponse the UI renders as a reasoning timeline,
 * a prediction card, a simulation summary, and a narrative. Every numeric
 * output is deterministic; Gemini (optional) only restyles the prose.
 */

import { predictMatch, getChampionProbabilities } from "@/lib/prediction-engine";
import { planQuery } from "./planner";
import { teamRef } from "./matchResolver";
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
import type {
  AgentResponse,
  PredictionBundle,
  PredictionResult,
  ReasoningStep,
  ChampionAnswer,
} from "./types";

export interface AgentInput {
  query: string;
  isFollowUp?: boolean;
  /** Slugs of the matchup the follow-up refers to (from the prior turn). */
  contextTeams?: string[];
  /** Disable persistence (e.g. internal preview). */
  persist?: boolean;
}

function step(
  id: string,
  title: string,
  description: string,
  detail?: string
): ReasoningStep {
  return { id, title, status: "completed", description, detail };
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

export async function runAgent(input: AgentInput): Promise<AgentResponse> {
  const { query } = input;
  const persist = input.persist ?? true;
  const plan = planQuery(query, input.isFollowUp);
  const createdAt = new Date();

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

    const fanInsight = `🏆 ${answer.contenders[0].flag} ${answer.contenders[0].name} lead the title race at ${(
      answer.contenders[0].champion * 100
    ).toFixed(1)}% — but 10k sims say it's wide open.`;

    const { text, enhanced } = await polishWithGemini(
      explanation,
      "Tournament title odds from a 10,000-run Monte Carlo simulation of the 2026 World Cup."
    );

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
    const explanation =
      "I couldn't pin down a matchup. Try naming two teams, e.g. **\"Who will win Argentina vs Portugal?\"**, or ask **\"Which team has the best chance to win the 2026 World Cup?\"**";
    return {
      intent: "unknown",
      query,
      reasoningSteps: steps,
      explanation,
      fanInsight: "Give me two teams and I'll run 10,000 simulations. ⚽",
      llmEnhanced: false,
      persisted: "none",
      createdAt: createdAt.toISOString(),
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
            "Converted the simulation into a clear, fan-friendly prediction."
          ),
        ];

  // Narrative.
  let explanation = buildExplanation(bundle);
  if (scenario) {
    explanation = `**What changed:** ${scenario.description}\n\n${explanation}`;
  }
  const fanInsight = buildFanInsight(bundle);
  const tiktokScript =
    plan.intent === "tiktok-preview" ? buildTiktokScript(bundle) : undefined;

  const { text, enhanced } = await polishWithGemini(
    explanation,
    `Match prediction: ${teamA.name} vs ${teamB.name}.${scenario ? " This is a what-if scenario re-analysis." : ""}`
  );

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
        followUpContext: scenario?.label ?? "",
        createdAt,
      })
    : "none";

  return {
    intent: plan.intent,
    query,
    reasoningSteps: steps,
    prediction: result,
    simulation,
    explanation: text,
    fanInsight,
    tiktokScript,
    scenarioNote: scenario?.label,
    llmEnhanced: enhanced,
    persisted,
    createdAt: createdAt.toISOString(),
  };
}

export { geminiConfigured };
export type { AgentResponse } from "./types";
