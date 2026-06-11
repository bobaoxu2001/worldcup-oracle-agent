/**
 * Tests for the live tournament-state layer (deterministic elimination gating).
 *
 * Run with:  npm run test:tournament
 *
 * Pure, no network/DB. Verifies that deterministic tournament state overrides
 * model probabilities: eliminated teams cannot appear as champions, the "can X
 * still win?" answer is a hard No, and the cache/demo fallback precedence holds.
 *
 * Exits with code 1 if any assertion fails.
 */

import assert from "node:assert";
import {
  classifyTeams,
  gateChampionOdds,
  isEliminated,
  eliminationNotice,
  decideSnapshot,
  demoSnapshot,
} from "@/lib/live-sports/tournamentState";
import { mapFdMatch } from "@/lib/live-sports/footballData";
import {
  buildGroupFixtures,
  buildKnockoutFixtures,
  mapLiveFixtures,
  mergeLiveIntoGroups,
  bracketColumns,
} from "@/lib/schedule/buildSchedule";
import type { TournamentStateSnapshot, LiveFixture } from "@/lib/live-sports/types";

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, `FAILED: ${name}`);
  console.log(`  ✓ ${name}`);
  passed++;
}

function snap(eliminated: string[]): TournamentStateSnapshot {
  const now = Date.now();
  return {
    mode: "live",
    source: "API-Football",
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 3_600_000).toISOString(),
    confidence: 0.9,
    teams: eliminated.map((s) => ({ slug: s, name: s, status: "eliminated" as const })),
    eliminatedSlugs: eliminated,
    eliminatedCount: eliminated.length,
  };
}

const CHAMPS = [
  { slug: "argentina", champion: 0.23 },
  { slug: "portugal", champion: 0.06 },
  { slug: "spain", champion: 0.22 },
];

console.log("classification from fixtures:");
const knockoutLoss: LiveFixture[] = [
  {
    id: 1,
    round: "Round of 16",
    status: "FT",
    homeSlug: "portugal",
    awaySlug: "spain",
    goalsHome: 1,
    goalsAway: 2,
    homeWinner: false,
    awayWinner: true,
    date: "2026-07-01",
  },
];
const classified = classifyTeams(knockoutLoss);
check(
  "knockout loss → Portugal eliminated",
  classified.find((t) => t.slug === "portugal")?.status === "eliminated"
);
check(
  "knockout win → Spain qualified",
  classified.find((t) => t.slug === "spain")?.status === "qualified"
);
const groupGame: LiveFixture[] = [
  { id: 2, round: "Group A - 1", status: "FT", homeSlug: "portugal", awaySlug: "spain", goalsHome: 0, goalsAway: 1, homeWinner: false, awayWinner: true, date: "2026-06-12" },
];
check(
  "group-stage loss does NOT eliminate (best-third safety)",
  classifyTeams(groupGame).find((t) => t.slug === "portugal")?.status !== "eliminated"
);

console.log("champion gating:");
check(
  "Portugal active → appears in champion odds",
  gateChampionOdds(CHAMPS, snap([])).champions.some((c) => c.slug === "portugal")
);
const gated = gateChampionOdds(CHAMPS, snap(["portugal"]));
check("Portugal eliminated → removed from champion odds", !gated.champions.some((c) => c.slug === "portugal"));
check("Portugal eliminated → reported as removed", gated.removed.includes("portugal"));
check('"Who can win?" still lists active teams', gated.champions.some((c) => c.slug === "argentina"));

console.log("elimination question:");
check("isEliminated true after elimination", isEliminated("portugal", snap(["portugal"])) === true);
check("isEliminated false when active", isEliminated("portugal", snap([])) === false);
const notice = eliminationNotice("portugal", snap(["portugal"]), "en-US");
check('"Can Portugal still win?" → answer says No', !!notice && /^No —/.test(notice) && /eliminated/i.test(notice));
check("active team → no elimination notice", eliminationNotice("portugal", snap([]), "en-US") === null);
check("Chinese elimination notice says 已经被淘汰", (eliminationNotice("portugal", snap(["portugal"]), "zh-CN") || "").includes("已经被淘汰"));

console.log("snapshot precedence (cache / live / demo / unavailable):");
const cache = snap(["portugal"]);
const live = snap(["germany"]);
check("fresh cache → served from cache", decideSnapshot({ cache, cacheFresh: true, live, apiConfigured: true }).mode === "cache");
check("API available, no fresh cache → live", decideSnapshot({ cache: null, cacheFresh: false, live, apiConfigured: true }).mode === "live");
check("API unavailable → stale cache used", decideSnapshot({ cache, cacheFresh: false, live: null, apiConfigured: true }).mode === "cache");
check("API key set but no data & no cache → unavailable (no false elimination)", decideSnapshot({ cache: null, cacheFresh: false, live: null, apiConfigured: true }).mode === "unavailable");
check("no key & no cache → demo", decideSnapshot({ cache: null, cacheFresh: false, live: null, apiConfigured: false }).mode === "demo");
check("demo snapshot has zero eliminations", demoSnapshot().eliminatedCount === 0);

console.log("football-data.org mapping:");
const fdKnockout = mapFdMatch({
  id: 9,
  utcDate: "2026-07-04T20:00:00Z",
  status: "FINISHED",
  stage: "LAST_16",
  homeTeam: { name: "Portugal", tla: "POR" },
  awayTeam: { name: "Spain", tla: "ESP" },
  score: { winner: "AWAY_TEAM", fullTime: { home: 1, away: 2 } },
});
check("FD LAST_16 → 'Round of 16' (knockout-classified)", fdKnockout.round === "Round of 16");
check("FD FINISHED → 'FT'", fdKnockout.status === "FT");
check("FD TLA codes resolve to canonical slugs", fdKnockout.homeSlug === "portugal" && fdKnockout.awaySlug === "spain");
check("FD winner mapped to homeWinner/awayWinner", fdKnockout.homeWinner === false && fdKnockout.awayWinner === true);
check(
  "FD knockout loss classifies elimination end-to-end",
  classifyTeams([fdKnockout]).find((t) => t.slug === "portugal")?.status === "eliminated"
);
const fdGroupDraw = mapFdMatch({
  status: "FINISHED",
  stage: "GROUP_STAGE",
  homeTeam: { name: "Portugal", tla: "POR" },
  awayTeam: { name: "Spain", tla: "ESP" },
  score: { winner: "DRAW", fullTime: { home: 1, away: 1 } },
});
check("FD group draw → no winner flags, no elimination", fdGroupDraw.homeWinner === null && classifyTeams([fdGroupDraw]).every((t) => t.status !== "eliminated"));
const fdScheduled = mapFdMatch({ status: "TIMED", stage: "LAST_16", homeTeam: { name: "Portugal", tla: "POR" }, awayTeam: { name: "Spain", tla: "ESP" }, score: { winner: null } });
check("FD scheduled knockout → not finished, no elimination", fdScheduled.status !== "FT" && classifyTeams([fdScheduled]).every((t) => t.status !== "eliminated"));

console.log("schedule builder (honest TBA, no invented dates):");
const groups = buildGroupFixtures();
check("12 groups built", groups.length === 12);
check("each group has 6 round-robin fixtures (72 total)", groups.reduce((n, g) => n + g.rows.length, 0) === 72);
check("group fixtures never invent a date/venue (all TBA)", groups.every((g) => g.rows.every((r) => r.date === "TBA" && r.venue === "TBA")));
const ko = buildKnockoutFixtures();
check("knockout fixtures use bracket slots + TBA kickoff", ko.length > 0 && ko.every((r) => r.date === "TBA" && r.venue === "TBA"));
const liveRows = mapLiveFixtures([
  { id: 1, round: "Round of 16", status: "FINISHED", homeSlug: "portugal", awaySlug: "spain", goalsHome: 1, goalsAway: 2, homeWinner: false, awayWinner: true, date: "2026-07-01T18:00:00Z" },
  { id: 2, round: "Group A", status: "TIMED", homeSlug: "mexico", awaySlug: null, goalsHome: null, goalsAway: null, homeWinner: null, awayWinner: null, date: "2026-06-12T20:00:00Z" },
]);
check("live finished fixture → Finished + score", liveRows.some((r) => r.status === "Finished" && r.goals === "1–2"));
check("live scheduled fixture → Scheduled", liveRows.some((r) => r.status === "Scheduled"));
check("unmapped opponent shows TBA (not invented)", liveRows.some((r) => r.teamB === "TBA"));

console.log("schedule display (verified dates merged, bracket columns):");
const merged = mergeLiveIntoGroups(buildGroupFixtures(), [
  // mexico v south-africa is a real Group A pairing — cached fixture provides the date
  { id: 7, round: "Group Stage", status: "FT", homeSlug: "south-africa", awaySlug: "mexico", goalsHome: 0, goalsAway: 2, homeWinner: false, awayWinner: true, date: "2026-06-11T19:00:00Z" },
]);
const ga = merged.find((g) => g.group === "A")!;
const matched = ga.rows.find((r) => r.date !== "TBA");
check("cached fixture date merges into the drawn pairing (either team order)", !!matched && matched.date === "2026-06-11T19:00:00Z");
check("merged finished fixture carries score + Finished", matched?.score === "0–2" && matched?.status === "Finished");
check("pairings without a cached fixture stay TBA", ga.rows.filter((r) => r.date === "TBA").length === 5);
const cols = bracketColumns();
check("bracket has 5 round columns R32→Final", cols.length === 5 && cols[0].round === "Round of 32" && cols[4].round === "Final");
check("column sizes 16/8/4/2/1", cols.map((c) => c.matches.length).join(",") === "16,8,4,2,1");
check("knockout kickoff stays TBA (never invented)", cols.every((c) => c.matches.every((m) => m.date === "TBA")));

console.log(`\nAll ${passed} tournament-state checks passed.`);
