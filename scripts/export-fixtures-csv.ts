/**
 * Export the (resolved) upcoming knockout fixtures into a small CSV the
 * Dixon-Coles model can forecast. Today that means the Round of 32, which is
 * fully determined once the group stage is complete (see lib/schedule/
 * qualification.ts). If the groups are not finished yet, nothing is written and
 * the DC forecast step is simply skipped.
 *
 * Output columns (no goals — these are fixtures, not results):
 *   fixture_id, round, home_slot, away_slot, home_team, away_team,
 *   neutral_or_home_context
 *
 * Home/away follow the official bracket slot ordering; a host nation (USA /
 * Mexico / Canada) in the home slot against a non-host is marked "home" so the
 * model's home-advantage term applies — every other tie is "neutral".
 *
 * Run:  npx tsx scripts/export-fixtures-csv.ts [outDir]
 *       (defaults to betting-backtest/data)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildGroupFixtures, mergeManualIntoGroups } from "../lib/schedule/buildSchedule";
import { resolveQualification } from "../lib/schedule/qualification";
import { getTeam, HOST_SLUGS } from "../lib/seed/world-cup-2026-groups";

const COLUMNS = [
  "fixture_id",
  "round",
  "home_slot",
  "away_slot",
  "home_team",
  "away_team",
  "neutral_or_home_context",
];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  const outDir = resolve(process.argv[2] ?? join(__dirname, "..", "betting-backtest", "data"));
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "fixtures.csv");

  const groups = mergeManualIntoGroups(buildGroupFixtures());
  const q = resolveQualification(groups);

  const rows: string[] = [COLUMNS.join(",")];
  if (!q.complete) {
    writeFileSync(outPath, rows.join("\n") + "\n", "utf-8");
    console.log(`Group stage not complete — wrote header-only fixtures.csv (no R32 yet) → ${outPath}`);
    return;
  }

  for (const m of q.r32) {
    const aHost = HOST_SLUGS.has(m.home);
    const bHost = HOST_SLUGS.has(m.away);
    const context = aHost && !bHost ? "home" : "neutral";
    rows.push(
      [
        `M${m.no}`,
        "Round of 32",
        m.homeLabel,
        m.awayLabel,
        getTeam(m.home).name,
        getTeam(m.away).name,
        context,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  writeFileSync(outPath, rows.join("\n") + "\n", "utf-8");
  console.log(`Wrote ${q.r32.length} Round-of-32 fixtures → ${outPath}`);
}

main();
