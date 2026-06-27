/**
 * Export the recorded World Cup 2026 results into the betting-backtest
 * `matches.csv` schema — the "pull tonight's scores" step of the nightly
 * Dixon-Coles refit pipeline.
 *
 * Source of truth: the manual results layer (lib/seed/manual-match-results.ts),
 * which is exactly what the rest of the app and the standings read. As knockout
 * results are recorded there, this exporter picks them up automatically — so a
 * nightly run always refits on the latest scores with zero extra steps.
 *
 * Output columns match betting-backtest/schema.py MATCHES_COLUMNS so the Python
 * model and the existing evaluator/decision engine share one canonical dataset.
 *
 * Orientation: when a host nation (USA / Mexico / Canada) plays a non-host, the
 * host is written as home_team with neutral_or_home_context="home" (goals
 * flipped to match) so the model's single home-advantage term is meaningful.
 * Every other game is "neutral".
 *
 * Run:  npx tsx scripts/export-results-csv.ts [outDir]
 *       (defaults to betting-backtest/data)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";
import { getTeam, HOST_SLUGS } from "../lib/seed/world-cup-2026-groups";

const COLUMNS = [
  "match_id",
  "date",
  "group",
  "home_team",
  "away_team",
  "venue",
  "neutral_or_home_context",
  "kickoff_time",
  "final_home_goals",
  "final_away_goals",
];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  const outDir = resolve(process.argv[2] ?? join(__dirname, "..", "betting-backtest", "data"));
  mkdirSync(outDir, { recursive: true });

  // Stable chronological order (date, then group) so match ids are reproducible.
  const sorted = [...MANUAL_MATCH_RESULTS].sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    return da < db ? -1 : da > db ? 1 : a.group < b.group ? -1 : a.group > b.group ? 1 : 0;
  });

  const rows: string[] = [COLUMNS.join(",")];
  let i = 0;
  for (const m of sorted) {
    i += 1;
    let homeSlug = m.teamA;
    let awaySlug = m.teamB;
    let homeGoals = m.scoreA;
    let awayGoals = m.scoreB;

    // Orient so a host playing a non-host is the home side (home advantage).
    const aHost = HOST_SLUGS.has(m.teamA);
    const bHost = HOST_SLUGS.has(m.teamB);
    const hostHomeGame = (aHost && !bHost) || (bHost && !aHost);
    if (bHost && !aHost) {
      homeSlug = m.teamB;
      awaySlug = m.teamA;
      homeGoals = m.scoreB;
      awayGoals = m.scoreA;
    }
    const context = hostHomeGame ? "home" : "neutral";

    const date = m.date ?? "";
    // The bundled data has no official kickoff/venue — keep them honest. A
    // deterministic kickoff stamp lets the walk-forward timestamp check pass for
    // any pre-match prediction without inventing a real time.
    const kickoff = date ? `${date}T18:00:00Z` : "";

    rows.push(
      [
        `m${String(i).padStart(2, "0")}`,
        date,
        m.group,
        getTeam(homeSlug).name,
        getTeam(awaySlug).name,
        "TBA",
        context,
        kickoff,
        homeGoals,
        awayGoals,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const outPath = join(outDir, "matches.csv");
  writeFileSync(outPath, rows.join("\n") + "\n", "utf-8");
  console.log(`Wrote ${sorted.length} matches → ${outPath}`);
}

main();
