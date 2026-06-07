/**
 * Agent domain types — the contract between the agent pipeline, the API layer,
 * and the UI. Everything the chat surface renders is described here.
 */

import type { MatchPrediction } from "@/lib/types";
import type { NewsCategory, NewsDirection, NewsImpact, NewsSource } from "@/lib/news/types";

/** What the planner decided the user is asking for. */
export type AgentIntent =
  | "match-prediction" // "Who wins Argentina vs Portugal?"
  | "champion-odds" // "Who will win the 2026 World Cup?"
  | "scenario" // follow-up: "What if Messi was unavailable?"
  | "tiktok-preview" // "Give me a TikTok-style preview..."
  | "team-news" // "Show me the latest Argentina news"
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

/** One news item as rendered in the UI / explanation. */
export interface NewsItemView {
  title: string;
  summary: string;
  category: NewsCategory;
  impactLevel: NewsImpact;
  direction: NewsDirection;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string; // ISO
  demo: boolean;
}

/** Per-team news view inside a news-impact report. */
export interface TeamNewsView {
  team: TeamRef;
  items: NewsItemView[];
  netDirection: NewsDirection | "mixed";
  /** One-line read of what the news means for this team. */
  headline: string;
}

/** How news shifted the headline probabilities (percentage points). */
export interface NewsAdjustment {
  applied: boolean; // true if any non-trivial shift happened
  base: { teamAWin: number; draw: number; teamBWin: number };
  adjusted: { teamAWin: number; draw: number; teamBWin: number };
  deltaPts: { teamAWin: number; draw: number; teamBWin: number };
}

/** The "Latest News Impact" report attached to a matchup prediction. */
export interface NewsImpactReport {
  teamA: TeamNewsView;
  teamB: TeamNewsView;
  adjustment: NewsAdjustment;
  note: string; // "Prediction impact: ..."
  source: NewsSource; // 'api' | 'demo'
  disclaimer: string;
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
  /** Daily news intelligence considered for this matchup (two-team intents). */
  newsImpact?: NewsImpactReport;
  /** Single-team news digest (team-news intent). */
  teamNews?: TeamNewsView;
  /** Whether news shown is from a live API ('api') or curated demo data. */
  newsSource?: NewsSource;
  /** Active live news provider name (e.g. "GNews"), or null in demo mode. */
  newsProvider?: string | null;
  /** True when an LLM (Gemini) generated the narrative, false on fallback. */
  llmEnhanced: boolean;
  persisted: "mongodb" | "memory" | "none";
  createdAt: string;
  /** Global Voice Mode: the language the answer was localized to (BCP-47). */
  language?: string;
  /** In-language one-line result summary (deterministic, used for TTS/headline). */
  localizedSummary?: string;
  /** How the narrative was localized: none (English) · gemini · template. */
  localizationMethod?: "none" | "gemini" | "template";
}

/** Internal: raw model bundle before narrative generation. */
export interface PredictionBundle {
  prediction: MatchPrediction;
  teamA: TeamRef;
  teamB: TeamRef;
  simulation: SimulationResult;
}
