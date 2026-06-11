import type { Metadata } from "next";
import { CalendarDays, Radio, Database, ShieldCheck } from "lucide-react";
import {
  buildGroupFixtures,
  buildKnockoutFixtures,
  mapLiveFixtures,
} from "@/lib/schedule/buildSchedule";
import { getCachedFixtures } from "@/lib/live-sports/tournamentState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule · WorldCup Oracle Agent",
  description:
    "World Cup 2026 fixtures — live results from the football-data.org cache when available, otherwise the bundled draw schedule with honest TBA labels (no invented kickoff times or venues).",
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

export default async function SchedulePage() {
  const { fixtures, fetchedAt } = await getCachedFixtures();
  const live = fixtures.length ? mapLiveFixtures(fixtures) : [];
  const groups = buildGroupFixtures();
  const knockout = buildKnockoutFixtures();

  const updated = fetchedAt
    ? new Date(fetchedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CalendarDays className="h-5 w-5 text-neon" />
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">World Cup 2026 Schedule</h1>
          {live.length > 0 ? (
            <span className="chip text-[10px] text-neon">
              <Radio className="h-3 w-3" /> football-data.org · MongoDB cache
            </span>
          ) : (
            <span className="chip text-[10px] text-amber-300/80">
              <Database className="h-3 w-3" /> bundled model schedule · TBA
            </span>
          )}
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The drawn group pairings and the official knockout bracket are exact. Kickoff times and
          venues aren&apos;t in the bundled draw data, so they show as <strong>TBA</strong> until a
          verified source provides them.
        </p>
      </header>

      {/* Transparency note */}
      <div className="glass mb-6 flex items-start gap-2 rounded-2xl p-4 text-[12px] leading-relaxed text-muted-foreground/90">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
        <span>
          Schedule data is shown only when available from verified seed data or live tournament-state
          cache. <strong>TBA</strong> means the app is not inventing official fixture details. Live
          results come from the <strong>football-data.org</strong> cache in MongoDB (no live API call
          is made to render this page){updated ? <> · last cached {updated}</> : null}.
        </span>
      </div>

      {/* Live fixtures (only when the cache has them) */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neon">
            Live fixtures &amp; results — football-data.org
          </h2>
          <div className="glass overflow-x-auto rounded-2xl p-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Stage</th>
                  <th className="px-3 py-2 font-medium">Match</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {live.map((r, i) => (
                  <tr key={i} className="border-t border-white/[0.05]">
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                      {r.date && r.date !== "TBA"
                        ? new Date(r.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "TBA"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{r.stage}</td>
                    <td className="px-3 py-2 font-medium">
                      {r.teamA} <span className="text-muted-foreground">vs</span> {r.teamB}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.goals || "—"}</td>
                    <td className="px-3 py-2">
                      <StatusChip status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Group stage — real pairings, TBA kickoff/venue */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Group stage — drawn pairings (bundled schedule)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.group} className="glass rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold">Group {g.group}</span>
                <span className="text-[10px] uppercase tracking-wide text-amber-300/70">
                  kickoff · venue TBA
                </span>
              </div>
              <ul className="space-y-1.5">
                {g.rows.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate">
                      {r.teamA} <span className="text-muted-foreground">v</span> {r.teamB}
                    </span>
                    <StatusChip status={r.status} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Knockout bracket — official slots, teams TBD */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Knockout bracket — official 2026 routing (teams TBA until groups finish)
        </h2>
        <div className="glass overflow-x-auto rounded-2xl p-2">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Match</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Pairing (bracket slots)</th>
                <th className="px-3 py-2 font-medium">Kickoff · venue</th>
              </tr>
            </thead>
            <tbody>
              {knockout.map((r) => (
                <tr key={r.matchNo} className="border-t border-white/[0.05]">
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                    M{r.matchNo}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{r.stage}</td>
                  <td className="px-3 py-2 font-medium">
                    {r.teamA} <span className="text-muted-foreground">vs</span> {r.teamB}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-amber-300/70">TBA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
