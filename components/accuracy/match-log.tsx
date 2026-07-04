"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TrackRecordMatch } from "@/lib/prediction-engine/trackRecord";

type Filter = "all" | "hit" | "miss" | "group" | "knockout";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hit", label: "Correct" },
  { key: "miss", label: "Missed" },
  { key: "group", label: "Group" },
  { key: "knockout", label: "Knockout" },
];

/**
 * Per-match honesty log: every graded fixture, the live model's pre-match
 * favourite + confidence, the actual result, and whether the top pick hit.
 * Client-side so judges can filter to the misses — we show them, we don't hide
 * them. Newest first.
 */
export function MatchLog({ matches }: { matches: TrackRecordMatch[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const shown = [...matches]
    .reverse()
    .filter((m) => {
      if (filter === "hit") return m.hit;
      if (filter === "miss") return !m.hit;
      if (filter === "group") return m.stage === "group";
      if (filter === "knockout") return m.stage === "knockout";
      return true;
    });

  const outcomeLabel = (m: TrackRecordMatch) => {
    if (m.actual === "D") {
      const advTeam = m.advances === m.teamA ? m.nameA : m.advances === m.teamB ? m.nameB : null;
      return advTeam ? `Draw · ${advTeam} adv.` : "Draw";
    }
    return `${m.actual === "A" ? m.nameA : m.nameB} win`;
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              filter === f.key
                ? "bg-neon/15 text-neon ring-1 ring-neon/30"
                : "bg-white/[0.03] text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {shown.length} of {matches.length}
        </span>
      </div>

      <div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
        {shown.map((m, i) => {
          const favName = m.favSlug === m.teamA ? m.nameA : m.nameB;
          return (
            <div
              key={`${m.date}-${m.teamA}-${m.teamB}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  m.hit ? "bg-neon/15 text-neon" : "bg-rose-500/15 text-rose-300"
                )}
                title={m.hit ? "Top pick correct" : "Top pick missed"}
              >
                {m.hit ? "✓" : "✗"}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <span>{m.flagA}</span>
                  <span className="truncate">{m.nameA}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {m.scoreA}–{m.scoreB}
                  </span>
                  <span className="truncate">{m.nameB}</span>
                  <span>{m.flagB}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Called{" "}
                  <span className="text-foreground/80">
                    {m.topPick === "D" ? "Draw" : favName + " win"}
                  </span>{" "}
                  @ {(m.favProb * 100).toFixed(0)}% · {outcomeLabel(m)}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    m.stage === "knockout"
                      ? "bg-electric/10 text-electric"
                      : "bg-white/[0.05] text-muted-foreground"
                  )}
                >
                  {m.stage === "knockout" ? m.group : "Grp " + m.group}
                </span>
                <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                  {m.date.slice(5)}
                </div>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No matches in this filter.</p>
        )}
      </div>
    </div>
  );
}
