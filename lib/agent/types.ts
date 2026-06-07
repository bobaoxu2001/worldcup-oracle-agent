/**
 * Agent domain types — the contract between the agent pipeline, the API layer,
 * and the UI. Everything the chat surface renders is described here.
 */

import type { MatchPrediction } from "@/lib/types";

/** What the planner decided the user is asking for. */
export type AgentIntent =
  | "match-prediction" // "Who wins Argentina vs Portugal?"
  | "champion-odds" // "Who will win the 2026 World Cup?"
  | "scenario" // follow-up: "What if Messi was unavailable?"
  | "tiktok-preview" // "Give me a TikTok-style preview..."
  | "unknown";

/** A single visible step in the agent's reasoning timeline. */
export interface ReasoningStep {
  id: string;
  title: string;
  status: "completed" | "running" | "pending";
  description: string;
  /** Optional structured detail rendered under the step. */
  detail?: string;
}

/** Output of the Monte Carlo single-match simulator. */
export interface SimulationResult {
  simulationsRun: number;
  teamAWin: number; // share 0–1
  draw: number;
  teamBWin: number;
  mostLikelyScore: string; // "2-1"
  topScorelines: { score: string; share: number }[];
  upsetProbability: number; // share the underdog wins outright
  avgGoalsA: number;
  avgGoalsB: number;
  summary: string;
}

/** The headline numbers the prediction card renders. */
export interface PredictionResult {
  teamA: TeamRef;
  teamB: TeamRef;
  teamAWin: number; // 0–1
  draw: number;
  teamBWin: number;
  confidenceLevel: string;
  confidenceScore: number; // 0–100
  mostLikelyScore: string;
  upsetProbability: number; // 0–1
  expectedScore: string;
  favorite: string; // team name or "Too close to call"
  keyFactors: { label: string; detail: string; weight: string }[];
}

export interface TeamRef {
  slug: string;
  name: string;
  flag: string;
  elo: number;
}

/** Champion-odds answer (for "who wins the whole thing" queries). */
export interface ChampionAnswer {
  simulationsRun: number;
  contenders: {
    slug: string;
    name: string;
    flag: string;
    champion: number; // 0–1
    elo: number;
  }[];
}

/** The complete answer the agent returns for one turn. */
export interface AgentResponse {
  intent: AgentIntent;
  query: string;
  reasoningSteps: ReasoningStep[];
  /** Present for match-prediction / scenario / tiktok intents. */
  prediction?: PredictionResult;
  simulation?: SimulationResult;
  /** Present for champion-odds intent. */
  champions?: ChampionAnswer;
  explanation: string; // plain-English "Why?"
  fanInsight: string; // punchy one/two-liner
  tiktokScript?: string; // optional social preview
  /** Scenario follow-ups note what changed vs the base prediction. */
  scenarioNote?: string;
  /** True when an LLM (Gemini) generated the narrative, false on fallback. */
  llmEnhanced: boolean;
  persisted: "mongodb" | "memory" | "none";
  createdAt: string;
}

/** Internal: raw model bundle before narrative generation. */
export interface PredictionBundle {
  prediction: MatchPrediction;
  teamA: TeamRef;
  teamB: TeamRef;
  simulation: SimulationResult;
}
