/**
 * Agent Planner — the agent's "decide what to do" step.
 *
 * Looks at the raw query (and whether this is a follow-up) and classifies the
 * intent, then names the plan of attack the timeline will visualise. Pure
 * heuristics — fast, deterministic, no API needed — so the agent always knows
 * its next move even with zero keys configured.
 */

import { resolveTeams, resolvePlayer } from "./matchResolver";
import { looksLikeRulesQuestion } from "./rulesExplain";
import type { AgentIntent } from "./types";

export interface Plan {
  intent: AgentIntent;
  teamSlugs: string[]; // resolved team slugs (0, 1, or 2)
  player?: { player: string; slug: string };
  /** Human-readable plan steps shown before execution. */
  planLabels: string[];
}

const CHAMPION_RE =
  /\b(win|lift|champion|champions?hip|trophy|whole thing|tournament|world cup)\b.*\b(2026|world cup|it all|tournament)\b|\b(best chance|most likely to win|who will win the 2026)\b/i;
// Broader tournament-forecast cues (incl. standalone "champion", favorites, 中文).
const TOURNAMENT_RE =
  /\b(world cup|champion|champions|championship|trophy|favou?rites?|win it all|go all the way|tournament winner|top \d+)\b|世界杯|夺冠|冠军|总冠军/i;
const TIKTOK_RE = /\b(tiktok|tik tok|reel|short|social|hype|preview)\b/i;
const SCENARIO_RE =
  /\b(what if|suppose|imagine|without|missing|unavailable|injured|out|suspended|sidelined|if .* (was|were|is|are)\b)/i;
// News-intelligence intent: user wants the latest team news / what changed.
const NEWS_RE =
  /\b(news|latest|updates?|injury report|roster|call[- ]?ups?|squad|what changed|who replaced|team news|this week)\b/i;
// References to (re)running a prediction — keeps a "does X news change the prediction?" follow-up on the match path.
const PREDICT_REF = /\b(predict|prediction|who (will )?win|odds|chance|affect|change the)\b/i;

export function planQuery(
  query: string,
  isFollowUp = false,
  hasContextMatchup = false
): Plan {
  const teams = resolveTeams(query);
  const teamSlugs = teams.map((t) => t.slug);
  const player = resolvePlayer(query) ?? undefined;

  let intent: AgentIntent;

  // A follow-up that names a what-if scenario re-analyses the prior matchup.
  if (isFollowUp && (SCENARIO_RE.test(query) || player)) {
    intent = "scenario";
  } else if (isFollowUp && hasContextMatchup && PREDICT_REF.test(query) && teamSlugs.length < 2) {
    // "Does the injury news change the prediction?" → re-run the prior matchup
    // (runAgent supplies the two teams from context).
    intent = "match-prediction";
  } else if (TIKTOK_RE.test(query) && teamSlugs.length === 2) {
    intent = "tiktok-preview";
  } else if (SCENARIO_RE.test(query) && (teamSlugs.length === 2 || player)) {
    intent = "scenario";
  } else if (teamSlugs.length === 2) {
    intent = "match-prediction";
  } else if (
    NEWS_RE.test(query) &&
    teamSlugs.length === 1 &&
    !(isFollowUp && PREDICT_REF.test(query))
  ) {
    // One team + a news cue → daily team-news digest. (As a follow-up asking
    // whether news changes the prediction, we keep it on the match path.)
    intent = "team-news";
  } else if (looksLikeRulesQuestion(query) && teamSlugs.length < 2) {
    // "How do best third-placed teams advance?" / "黄牌怎么影响小组排名？"
    intent = "rules-explanation";
  } else if (CHAMPION_RE.test(query) || TOURNAMENT_RE.test(query)) {
    intent = "champion-odds";
  } else if (teamSlugs.length === 1) {
    // One team named, no clear matchup → treat as title-contender question.
    intent = "champion-odds";
  } else {
    intent = "unknown";
  }

  const planLabels = planLabelsFor(intent);
  return { intent, teamSlugs, player, planLabels };
}

function planLabelsFor(intent: AgentIntent): string[] {
  switch (intent) {
    case "champion-odds":
      return [
        "Identify the question scope (full tournament)",
        "Load all 48 team profiles & Elo ratings",
        "Run 10,000 full-tournament Monte Carlo simulations",
        "Rank contenders & generate the title report",
      ];
    case "scenario":
      return [
        "Detect the scenario change vs the base matchup",
        "Re-weight team strength for the new conditions",
        "Re-run the Monte Carlo simulation",
        "Explain what shifted and why",
      ];
    case "tiktok-preview":
      return [
        "Gather match data & team profiles",
        "Analyze team strength & storylines",
        "Run 10,000-match Monte Carlo simulation",
        "Write a punchy social-ready preview",
      ];
    case "match-prediction":
      return [
        "Gather match data & identify the teams",
        "Pull recent team news (injuries, squad, tactics)",
        "Analyze team strength + news impact",
        "Run 10,000-match Monte Carlo simulation",
        "Generate the news-aware prediction report",
      ];
    case "team-news":
      return [
        "Identify the team",
        "Pull the latest team news",
        "Classify each item (category & impact)",
        "Summarize what it means for the team",
      ];
    case "rules-explanation":
      return [
        "Identify the rules question",
        "Locate the relevant 2026 World Cup rule",
        "Explain it in plain language with examples",
      ];
    default:
      return [
        "Parse the question",
        "Look for teams or a tournament-level intent",
        "Decide the best analysis to run",
      ];
  }
}
