import type { Metadata } from "next";
import { CalendarDays, Radio, Database, ShieldCheck } from "lucide-react";
import {
  buildGroupFixtures,
  mergeLiveIntoGroups,
  bracketColumns,
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

export default async function SchedulePage() {
  const { fixtures, fetchedAt } = await getCachedFixtures();
  const live = fixtures.length ? mapLiveFixtures(fixtures) : [];
  // Drawn pairings, enriched with VERIFIED kickoff dates/results from the
  // football-data.org cache where the same two teams match (else TBA).
  const groups = mergeLiveIntoGroups(buildGroupFixtures(), fixtures);
  const bracket = bracketColumns();

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
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  kickoff (UTC) or TBA
                </span>
              </div>
              <ul className="space-y-1.5">
                {g.rows.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate">
                      {r.teamA} <span className="text-muted-foreground">v</span> {r.teamB}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums">
                      {r.status === "Live" && <StatusChip status="Live" />}{" "}
                      {r.score && (
                        <span className="font-bold text-foreground">{r.score} · </span>
                      )}
                      <span
                        className={
                          r.date === "TBA" ? "text-amber-300/70" : "font-medium text-muted-foreground"
                        }
                      >
                        {fmtKickoff(r.date)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
