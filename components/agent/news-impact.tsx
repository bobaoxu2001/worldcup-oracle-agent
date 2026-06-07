import { Newspaper, ArrowRight } from "lucide-react";
import { NewsItemCard } from "@/components/news/news-item-card";
import { cn } from "@/lib/utils";
import type { NewsImpactReport, TeamNewsView } from "@/lib/agent/types";

/** "Latest News Impact" — recent news for both teams + how it moved the line. */
export function NewsImpact({ report }: { report: NewsImpactReport }) {
  const { adjustment: adj } = report;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Newspaper className="h-4 w-4 text-neon" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Latest news impact
        </span>
        <span className="chip text-[10px]">
          {report.source === "demo" ? "Demo news data" : "Live news"}
        </span>
      </div>

      {/* base → adjusted, if news moved anything */}
      {adj.applied ? (
        <div className="mb-4 rounded-xl border border-electric/20 bg-electric/[0.05] p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-electric">
            Prediction impact (news signal layer)
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <ShiftCell label={report.teamA.team.name} delta={adj.deltaPts.teamAWin} value={adj.adjusted.teamAWin} />
            <ShiftCell label="Draw" delta={adj.deltaPts.draw} value={adj.adjusted.draw} />
            <ShiftCell label={report.teamB.team.name} delta={adj.deltaPts.teamBWin} value={adj.adjusted.teamBWin} />
          </div>
        </div>
      ) : (
        <p className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
          {report.note}
        </p>
      )}

      {/* per-team news columns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamColumn view={report.teamA} />
        <TeamColumn view={report.teamB} />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
        {report.disclaimer}
      </p>
    </div>
  );
}

function ShiftCell({ label, delta, value }: { label: string; delta: number; value: number }) {
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <div className="rounded-lg bg-white/[0.03] p-2">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-bold tabular-nums">{(value * 100).toFixed(0)}%</p>
      <p
        className={cn(
          "text-[11px] font-semibold tabular-nums",
          flat ? "text-muted-foreground" : up ? "text-neon" : "text-red-400"
        )}
      >
        {flat ? "±0" : `${up ? "+" : ""}${delta}`} pt{Math.abs(delta) === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function TeamColumn({ view }: { view: TeamNewsView }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{view.team.flag}</span>
        <span className="text-sm font-bold">{view.team.name}</span>
      </div>
      <p className="mb-2 flex items-start gap-1 text-xs text-muted-foreground">
        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
        {view.headline}
      </p>
      <div className="space-y-2">
        {view.items.length === 0 ? (
          <p className="rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
            No significant recent news.
          </p>
        ) : (
          view.items.slice(0, 3).map((it, i) => <NewsItemCard key={i} item={it} compact />)
        )}
      </div>
    </div>
  );
}
