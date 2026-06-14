import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Database, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import {
  buildGroupFixtures,
  mergeLiveIntoGroups,
  mergeManualIntoGroups,
  bracketColumns,
} from "@/lib/schedule/buildSchedule";
import { computeStandings } from "@/lib/schedule/standings";
import { getCachedFixtures } from "@/lib/live-sports/tournamentState";
import { getTeam } from "@/lib/seed/world-cup-2026-groups";
import { fmtDatetime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule · WorldCup Oracle Agent",
  description:
    "World Cup 2026 group stage schedule — drawn pairings with standings that update from completed, manually entered results, plus the official knockout bracket.",
};

const STATUS_STYLE: Record<string, string> = {
  Finished: "text-muted-foreground border-white/10",
  Live: "text-neon border-neon/30",
  Scheduled: "text-sky-300/90 border-sky-400/20",
  TBA: "text-amber-300/80 border-amber-400/20",
  Unknown: "text-muted-foreground border-white/10",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        STATUS_STYLE[status] ?? STATUS_STYLE.Unknown
      }`}
    >
      {status}
    </span>
  );
}

/** Concise verified-kickoff display ("Jun 11 · 18:00 UTC") or honest "TBA". */
function fmtKickoff(iso: string): string {
  if (!iso || iso === "TBA") return "TBA";
  const d = new Date(iso);
  if (isNaN(+d)) return "TBA";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const hm = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return hm === "00:00" ? date : `${date} · ${hm} UTC`;
}

/** Date-only display ("Jun 11") — used next to a final score, where the
 *  kickoff time is no longer interesting and crowds narrow rows. */
function fmtShortDate(iso: string): string {
  if (!iso || iso === "TBA") return "TBA";
  const d = new Date(iso);
  if (isNaN(+d)) return "TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Agent-page link that pre-submits a match question (slug → clean name). */
function askHref(slugA: string, slugB: string): string {
  const a = getTeam(slugA).name;
  const b = getTeam(slugB).name;
  return `/?q=${encodeURIComponent(`Who will win ${a} vs ${b}?`)}`;
}

/** Small "ask the agent about this match" affordance used on fixture rows. */
function AskOracleLink({ slugA, slugB }: { slugA: string; slugB: string }) {
  return (
    <Link
      href={askHref(slugA, slugB)}
      title={`Ask the Oracle: ${getTeam(slugA).name} vs ${getTeam(slugB).name}`}
      aria-label={`Ask the Oracle about ${getTeam(slugA).name} vs ${getTeam(slugB).name}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neon/20 bg-neon/[0.04] px-2 py-0.5 text-[10px] font-semibold text-neon/90 transition hover:border-neon/50 hover:bg-neon/[0.12] hover:text-neon"
    >
      <Sparkles className="h-3 w-3" /> Ask
    </Link>
  );
}

export default async function SchedulePage() {
  const { fixtures, fetchedAt } = await getCachedFixtures();
  // Drawn pairings, enriched with VERIFIED kickoff dates/results from the
  // football-data.org cache where the same two teams match (else TBA), then
  // with manually entered results (clearly labelled; live always wins).
  const groups = mergeManualIntoGroups(mergeLiveIntoGroups(buildGroupFixtures(), fixtures));
  const standingsByGroup = new Map(computeStandings(groups).map((s) => [s.group, s]));
  const anyManual = groups.some((g) => g.rows.some((r) => r.resultSource === "manual"));
  const bracket = bracketColumns();

  const updated = fetchedAt ? fmtDatetime(fetchedAt) : null;

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CalendarDays className="h-5 w-5 text-neon" />
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">World Cup 2026 Schedule</h1>
          <span className="chip text-[10px] text-amber-300/80">
            <Database className="h-3 w-3" /> drawn pairings · manual results
          </span>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Group tables update from completed results. Results are entered manually (no live sports
          API is configured) and updated as matches finish. Kickoff times and venues aren&apos;t in
          the bundled draw data, so they show as <strong>TBA</strong> until a verified source
          provides them.
        </p>
      </header>

      {/* Transparency note */}
      <div className="glass mb-6 flex items-start gap-2 rounded-2xl p-4 text-[12px] leading-relaxed text-muted-foreground/90">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
        <span>
          Schedule data is shown only when available from verified seed data or the cached
          tournament-state results. <strong>TBA</strong> means the app is not inventing official
          fixture details. Manually entered results are always labelled{" "}
          <strong>MANUAL</strong> and never override verified cached results
          {updated ? <> · cache last updated {updated}</> : null}.
        </span>
      </div>

      {/* Group stage — drawn pairings + standings per group */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-neon">
            <Trophy className="h-3.5 w-3.5" /> Group Stage Schedule
          </h2>
          {anyManual && (
            <span className="chip text-[10px] text-amber-300/80">
              includes manually entered results
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const s = standingsByGroup.get(g.group);
            return (
              <div key={g.group} className="glass min-w-0 rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold">Group {g.group}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s && s.liveResults + s.manualResults > 0 ? (
                      <>
                        {s.liveResults > 0 && `${s.liveResults} live`}
                        {s.liveResults > 0 && s.manualResults > 0 && " · "}
                        {s.manualResults > 0 && (
                          <span className="text-amber-300/80">{s.manualResults} manual</span>
                        )}{" "}
                        result{s.liveResults + s.manualResults === 1 ? "" : "s"}
                      </>
                    ) : (
                      "Awaiting results"
                    )}
                  </span>
                </div>

                {/* Standings — always shown; all-zero rows before any result */}
                {s && (
                  <div className="mb-3 grid grid-cols-[auto_1fr_repeat(4,minmax(0,auto))] items-center gap-x-2.5 gap-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[13px]">
                    <span />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Team
                    </span>
                    {["P", "W·D·L", "GD", "Pts"].map((h) => (
                      <span
                        key={h}
                        className="text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </span>
                    ))}
                    {s.rows.map((r, i) => (
                      <div key={r.slug} className="contents">
                        <span className="text-[11px] font-bold text-muted-foreground">{i + 1}</span>
                        <span className={`min-w-0 truncate font-medium ${i < 2 ? "" : "text-muted-foreground"}`}>
                          {r.flag} {r.name}
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">{r.played}</span>
                        <span className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                          {r.won}·{r.drawn}·{r.lost}
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                        </span>
                        <span className="text-right font-bold tabular-nums text-neon">{r.points}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fixtures — drawn pairings with results where completed */}
                <ul className="space-y-1.5">
                  {g.rows.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="min-w-0 truncate">
                        {r.teamA} <span className="text-muted-foreground">v</span> {r.teamB}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-right text-[11px] tabular-nums">
                        {r.status === "Live" && <StatusChip status="Live" />}
                        {r.score && (
                          <span
                            className="font-bold text-foreground"
                            title={
                              r.resultSource === "manual"
                                ? "Manually entered result (seed file)"
                                : "Verified result — tournament-state cache"
                            }
                          >
                            {r.resultSource === "manual" && (
                              <span className="mr-0.5 align-middle text-[9px] font-semibold uppercase text-amber-300/80">
                                manual
                              </span>
                            )}{" "}
                            {r.score} ·
                          </span>
                        )}
                        <span
                          className={
                            r.date === "TBA" ? "text-amber-300/70" : "font-medium text-muted-foreground"
                          }
                        >
                          {r.score ? fmtShortDate(r.date) : fmtKickoff(r.date)}
                        </span>
                        {r.slugA && r.slugB && <AskOracleLink slugA={r.slugA} slugB={r.slugB} />}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          Standings count only finished matches — verified cached results plus manually entered
          results (labelled, never overriding verified data; edit{" "}
          <code className="text-foreground/70">lib/seed/manual-match-results.ts</code>). Top 2
          qualify directly; 8 of 12 third-placed teams also advance.
        </p>
      </section>

      {/* Knockout bracket — official routing as a round-by-round bracket view */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Knockout bracket — official 2026 routing (teams TBA until groups finish)
        </h2>
        <div className="glass overflow-x-auto rounded-2xl p-4">
          <div className="flex min-w-[1060px] items-stretch gap-4">
            {bracket.map((col) => (
              <div key={col.round} className="flex w-[196px] shrink-0 flex-col">
                <h3 className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neon">
                  {col.round}
                </h3>
                <div className="flex flex-1 flex-col justify-around gap-2">
                  {col.matches.map((m) => (
                    <div
                      key={m.matchNo}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition hover:border-neon/25"
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold">M{m.matchNo}</span>
                        <span className="text-amber-300/70">
                          {m.date === "TBA" ? "TBA" : fmtKickoff(m.date)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[13px] font-semibold tabular-nums">
                        {m.teamA} <span className="font-normal text-muted-foreground">vs</span>{" "}
                        {m.teamB}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          Pairings show official bracket slots (1A = Group A winners, W73 = winner of Match 73,
          3rd→M74 = best-third assigned by FIFA Annex C). Kickoff &amp; venue: TBA.
        </p>
      </section>
    </div>
  );
}
