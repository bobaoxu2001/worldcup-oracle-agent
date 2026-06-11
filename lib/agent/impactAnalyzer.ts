/**
 * Injury / Squad Impact Analyzer — the agent's "does the news move the line?" step.
 *
 * A deliberately SIMPLE, TRANSPARENT signal layer on top of the base model:
 *
 *   per item magnitude:  high = 4.5 pts · medium = 2.0 pts · low = 0 (mention only)
 *   direction:           negative hurts the team, positive helps, neutral = 0
 *   per-team cap:        ±10 pts so news can never dominate the model
 *
 * A team's own swing is redistributed 60/40 to the opponent's win and the draw,
 * so probabilities stay conserved; we then clamp and normalise to exactly 100%.
 *
 * This is NOT a replacement for the Elo + Dixon-Coles + Monte Carlo prediction —
 * it is a lightweight, explainable nudge from the latest available news signals.
 */

import type { ResolvedNews, ResolvedTeamNews } from "./newsResolver";
import type {
  NewsAdjustment,
  NewsImpactReport,
  TeamNewsView,
} from "./types";
import type { NewsDirection } from "@/lib/news/types";

const MAGNITUDE = { high: 0.045, medium: 0.02, low: 0 } as const;
const TEAM_CAP = 0.1; // ±10 percentage points max per team
const OPP_SHARE = 0.6;
const DRAW_SHARE = 0.4;

const DISCLAIMER =
  "Based on currently available news signals; recent updates may affect the outcome. This is a lightweight signal layer on top of the base simulation, not a replacement for the prediction model — and not financial or betting advice.";

/** Net signed swing to a team's OWN win probability from its news (capped). */
function selfDelta(team: ResolvedTeamNews): number {
  let d = 0;
  for (const it of team.items) {
    const mag = MAGNITUDE[it.impactLevel];
    if (mag === 0) continue;
    if (it.direction === "negative") d -= mag;
    else if (it.direction === "positive") d += mag;
  }
  return Math.max(-TEAM_CAP, Math.min(TEAM_CAP, d));
}

function netDirection(team: ResolvedTeamNews): NewsDirection | "mixed" {
  const hasNeg = team.items.some((i) => i.direction === "negative" && MAGNITUDE[i.impactLevel] > 0);
  const hasPos = team.items.some((i) => i.direction === "positive" && MAGNITUDE[i.impactLevel] > 0);
  if (hasNeg && hasPos) return "mixed";
  if (hasNeg) return "negative";
  if (hasPos) return "positive";
  return "neutral";
}

function teamHeadline(team: ResolvedTeamNews, d: number): string {
  const name = team.team.name;
  if (team.items.length === 0) return `No significant recent news for ${name}.`;
  if (Math.abs(d) < 0.001) {
    return `${name}'s latest updates are noted but don't materially shift the model.`;
  }
  // Pick the strongest item to phrase the read.
  const strongest = [...team.items].sort(
    (a, b) => MAGNITUDE[b.impactLevel] - MAGNITUDE[a.impactLevel]
  )[0];
  const aspect =
    strongest.category === "injury"
      ? "squad stability"
      : strongest.category === "suspension"
        ? "availability"
        : strongest.category === "form"
          ? "sharpness"
          : strongest.category === "tactics"
            ? "setup"
            : strongest.category === "squad"
              ? "squad depth"
              : "outlook";
  const dir = d < 0 ? "slightly reduced" : "slightly improved";
  const pts = Math.abs(Math.round(d * 100));
  return `${name}'s ${aspect} was ${dir} (${strongest.impactLevel}-impact ${strongest.category} news, ≈${pts} pt${pts === 1 ? "" : "s"}).`;
}

/** Build the per-team view (direction + one-line read). Reused by team-news. */
export function summarizeTeam(team: ResolvedTeamNews): TeamNewsView {
  const d = selfDelta(team);
  return {
    team: team.team,
    items: team.views,
    netDirection: netDirection(team),
    headline: teamHeadline(team, d),
  };
}

function clampNorm(a: number, draw: number, b: number) {
  const f = (x: number) => Math.max(0.01, x);
  let [x, y, z] = [f(a), f(draw), f(b)];
  const s = x + y + z;
  x /= s;
  y /= s;
  z /= s;
  return { teamAWin: x, draw: y, teamBWin: z };
}

export function analyzeNewsImpact(
  news: ResolvedNews,
  base: { teamAWin: number; draw: number; teamBWin: number }
): NewsImpactReport {
  const dA = selfDelta(news.teamA);
  const dB = selfDelta(news.teamB);

  // winA' = winA + dA - OPP_SHARE*dB ; winB' = winB + dB - OPP_SHARE*dA
  // draw' = draw - DRAW_SHARE*(dA + dB)
  const rawA = base.teamAWin + dA - OPP_SHARE * dB;
  const rawB = base.teamBWin + dB - OPP_SHARE * dA;
  const rawDraw = base.draw - DRAW_SHARE * (dA + dB);

  const adjusted = clampNorm(rawA, rawDraw, rawB);
  const deltaPts = {
    teamAWin: Math.round((adjusted.teamAWin - base.teamAWin) * 100),
    draw: Math.round((adjusted.draw - base.draw) * 100),
    teamBWin: Math.round((adjusted.teamBWin - base.teamBWin) * 100),
  };
  const applied =
    Math.abs(deltaPts.teamAWin) + Math.abs(deltaPts.teamBWin) + Math.abs(deltaPts.draw) > 0;

  const teamAView = summarizeTeam(news.teamA);
  const teamBView = summarizeTeam(news.teamB);

  const adjustment: NewsAdjustment = { applied, base, adjusted, deltaPts };

  let note: string;
  if (!applied) {
    note =
      "Prediction impact: no material change — the latest news is noted but doesn't move the model beyond rounding.";
  } else {
    const parts: string[] = [];
    const fmt = (name: string, d: number) =>
      `${name} ${d > 0 ? "+" : ""}${d} pt${Math.abs(d) === 1 ? "" : "s"}`;
    if (deltaPts.teamAWin !== 0) parts.push(fmt(news.teamA.team.name, deltaPts.teamAWin));
    if (deltaPts.teamBWin !== 0) parts.push(fmt(news.teamB.team.name, deltaPts.teamBWin));
    if (deltaPts.draw !== 0) parts.push(fmt("Draw", deltaPts.draw));
    note = `Prediction impact (news signal layer): ${parts.join(", ")}.`;
  }

  return {
    teamA: teamAView,
    teamB: teamBView,
    adjustment,
    note,
    source: news.source,
    disclaimer: DISCLAIMER,
  };
}

/** Deterministic digest for the single-team news intent. */
export function buildTeamNewsDigest(
  view: TeamNewsView,
  source: "api" | "demo"
): string {
  const lines: string[] = [`**Latest ${view.team.name} ${view.team.flag} team news:**`];
  if (view.items.length === 0) {
    lines.push("\nNo significant recent news found for this team right now.");
    return lines.join("\n");
  }
  for (const it of view.items.slice(0, 6)) {
    const cap = it.impactLevel.charAt(0).toUpperCase() + it.impactLevel.slice(1);
    const dir =
      it.direction === "negative" ? "↓" : it.direction === "positive" ? "↑" : "•";
    lines.push(`\n${dir} ${cap} impact · ${it.category} — ${it.title}`);
    if (it.summary) lines.push(`  ${it.summary}`);
  }
  // Honesty over hype: if nothing in the batch is a real injury/suspension/
  // conflict signal with at least medium impact, say so plainly — the agent
  // never invents squad trouble that the sources don't support.
  const strongSignal = view.items.some(
    (it) =>
      (it.category === "injury" || it.category === "suspension") && it.impactLevel !== "low"
  );
  if (source === "api" && !strongSignal) {
    lines.push(
      "\n_I found recent headlines, but no strong team-specific injury/suspension/conflict signal in the current news batch._"
    );
  }
  lines.push(`\n${view.headline}`);
  lines.push(
    "\nAsk me to predict a matchup and I'll fold this news into the probabilities."
  );
  if (source === "demo")
    lines.push("\n_News shown is curated demo data (sample signals), not verified live news._");
  return lines.join("\n");
}

/** Deterministic "Latest team news considered" block for the explanation. */
export function buildNewsNarrative(report: NewsImpactReport): string {
  const lines: string[] = ["**Latest team news considered:**"];
  const block = (v: TeamNewsView) => {
    lines.push(`\n${v.team.flag} ${v.team.name}:`);
    if (v.items.length === 0) {
      lines.push("• No significant recent news.");
      return;
    }
    for (const it of v.items.slice(0, 3)) {
      const cap = it.impactLevel.charAt(0).toUpperCase() + it.impactLevel.slice(1);
      lines.push(`• ${cap} impact (${it.category}): ${it.title}`);
    }
  };
  block(report.teamA);
  block(report.teamB);
  lines.push(`\n${report.note}`);
  if (report.source === "demo")
    lines.push("\n_News shown is curated demo data (sample signals), not verified live news._");
  return lines.join("\n");
}
