import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupTableData } from "@/lib/agent/types";

/** Group qualification table: advance / win-group / expected points per team. */
export function GroupTableCard({ table }: { table: GroupTableData }) {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Table2 className="h-4 w-4 text-neon" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Group {table.group} — qualification odds
        </span>
        <span className="chip ml-auto text-[10px]">20,000 group simulations</span>
      </div>

      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-3 gap-y-2 text-sm">
        <span />
        <ColHead>Team</ColHead>
        <ColHead>Top-2</ColHead>
        <ColHead>Win group</ColHead>
        <ColHead>xPts</ColHead>

        {table.rows.map((r, i) => {
          const focus = table.focusSlug === r.slug;
          return (
            <div key={r.slug} className="contents">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
              <span className={cn("flex items-center gap-2 font-semibold", focus && "text-neon")}>
                <span className="text-lg">{r.flag}</span>
                {r.name}
                <span className="text-[10px] font-medium text-muted-foreground">Elo {r.elo}</span>
              </span>
              <Cell strong={i < 2 || focus}>{pct(r.advance)}</Cell>
              <Cell>{pct(r.winGroup)}</Cell>
              <Cell>{r.expectedPoints.toFixed(1)}</Cell>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
        Top 2 qualify directly. Finishing third is still alive: <strong>8 of the 12 third-placed
        teams advance</strong> to the Round of 32 (ranked by points → goal difference → goals scored
        → fair play → FIFA ranking).
      </p>
    </div>
  );
}

function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
function Cell({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span className={cn("text-right tabular-nums", strong ? "font-bold" : "text-muted-foreground")}>
      {children}
    </span>
  );
}
