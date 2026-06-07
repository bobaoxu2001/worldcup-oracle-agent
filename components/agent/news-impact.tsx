import { Newspaper, ArrowRight, Radio } from "lucide-react";
import { NewsItemCard } from "@/components/news/news-item-card";
import { cn } from "@/lib/utils";
import type { NewsImpactReport, NewsItemView, TeamNewsView } from "@/lib/agent/types";

/** "Latest News Impact" — recent news for both teams + how it moved the line. */
export function NewsImpact({
  report,
  provider,
}: {
  report: NewsImpactReport;
  provider?: string | null;
}) {
  const { adjustment: adj } = report;
  const live = report.source === "api";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Newspaper className="h-4 w-4 text-neon" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Latest news impact
        </span>
        <span
          className={cn(
            "chip text-[10px]",
            live ? "border-neon/30 text-neon" : "border-amber-400/30 text-amber-300"
          )}
        >
          <Radio className="h-3 w-3" />
          {live ? `Live news${provider ? ` · ${provider}` : ""}` : "Demo · Sample news signals"}
        </span>
      </div>

      {/* base vs adjusted probabilities */}
      <div className="mb-4 overflow-hidden rounded-xl border border-electric/20 bg-electric/[0.04]">
        <div className="border-b border-white/[0.06] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-electric">
          Base vs news-adjusted probabilities
        </div>
        <div className="px-3 py-3">
          <ProbTable
            teamA={report.teamA.team.name}
            teamB={report.teamB.team.name}
            base={adj.base}
            adjusted={adj.adjusted}
            delta={adj.deltaPts}
            applied={adj.applied}
          />
          <p className="mt-3 flex items-start gap-1.5 text-xs text-foreground/90">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
            <span>
              <span className="font-semibold">Impact:</span>{" "}
              {adj.applied ? causingSummary(report) : "the latest news is noted but doesn't move the model beyond rounding."}
            </span>
          </p>
        </div>
      </div>

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

function ProbTable({
  teamA,
  teamB,
  base,
  adjusted,
  delta,
  applied,
}: {
  teamA: string;
  teamB: string;
  base: { teamAWin: number; draw: number; teamBWin: number };
  adjusted: { teamAWin: number; draw: number; teamBWin: number };
  delta: { teamAWin: number; draw: number; teamBWin: number };
  applied: boolean;
}) {
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-3 gap-y-1.5 text-sm">
      {/* header */}
      <span />
      <ColHead>{teamA} win</ColHead>
      <ColHead>Draw</ColHead>
      <ColHead>{teamB} win</ColHead>

      {/* base row */}
      <RowLabel>Base model</RowLabel>
      <Cell>{pct(base.teamAWin)}</Cell>
      <Cell>{pct(base.draw)}</Cell>
      <Cell>{pct(base.teamBWin)}</Cell>

      {/* adjusted row */}
      <RowLabel highlight>News-adjusted</RowLabel>
      <Cell highlight>{pct(adjusted.teamAWin)}</Cell>
      <Cell highlight>{pct(adjusted.draw)}</Cell>
      <Cell highlight>{pct(adjusted.teamBWin)}</Cell>

      {/* delta row */}
      <RowLabel>Δ news</RowLabel>
      <DeltaCell d={applied ? delta.teamAWin : 0} />
      <DeltaCell d={applied ? delta.draw : 0} />
      <DeltaCell d={applied ? delta.teamBWin : 0} />
    </div>
  );
}

function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
function RowLabel({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap text-[11px] font-medium uppercase tracking-wide",
        highlight ? "text-neon" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}
function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "text-center font-bold tabular-nums",
        highlight ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}
function DeltaCell({ d }: { d: number }) {
  const flat = d === 0;
  return (
    <span
      className={cn(
        "text-center text-xs font-semibold tabular-nums",
        flat ? "text-muted-foreground" : d > 0 ? "text-neon" : "text-red-400"
      )}
    >
      {flat ? "±0" : `${d > 0 ? "+" : ""}${d}`}
    </span>
  );
}

/** One-line "why the numbers moved", built from the highest-impact news items. */
function causingSummary(report: NewsImpactReport): string {
  const causes: string[] = [];
  for (const tv of [report.teamA, report.teamB]) {
    const top = tv.items
      .filter((i) => i.direction !== "neutral" && i.impactLevel !== "low")
      .sort((a, b) => weight(b) - weight(a))[0];
    if (top) {
      const dir = top.direction === "negative" ? "weakened" : "boosted";
      causes.push(`${tv.team.name} ${dir} by ${top.impactLevel}-impact ${top.category} (${top.title.toLowerCase()})`);
    }
  }
  return causes.length ? `${causes.join("; ")}.` : report.note;
}
function weight(i: NewsItemView): number {
  return i.impactLevel === "high" ? 2 : i.impactLevel === "medium" ? 1 : 0;
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
