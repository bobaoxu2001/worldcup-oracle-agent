import { Activity } from "lucide-react";
import type { SimulationResult } from "@/lib/agent/types";

/** Highlights the Monte Carlo run — makes the agent feel substantial. */
export function SimulationCenter({
  sim,
  teamA,
  teamB,
}: {
  sim: SimulationResult;
  teamA: { name: string; flag: string };
  teamB: { name: string; flag: string };
}) {
  const maxShare = Math.max(...sim.topScorelines.map((s) => s.share), 0.01);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-neon" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
            Simulation center
          </span>
        </div>
        <span className="chip text-[10px]">
          {sim.simulationsRun.toLocaleString()} simulations completed
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* scoreline distribution */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Most common scorelines
          </p>
          <div className="space-y-2">
            {sim.topScorelines.map((s) => (
              <div key={s.score} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-sm font-bold tabular-nums">
                  {s.score.replace("-", "–")}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon to-electric"
                    style={{ width: `${(s.share / maxShare) * 100}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {(s.share * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* key sim numbers */}
        <div className="grid grid-cols-2 gap-3 self-start">
          <MiniStat label="Top result" value={sim.mostLikelyScore.replace("-", "–")} />
          <MiniStat label="Upset rate" value={`${(sim.upsetProbability * 100).toFixed(0)}%`} />
          <MiniStat
            label={`Avg ${teamA.flag}`}
            value={sim.avgGoalsA.toFixed(2)}
          />
          <MiniStat
            label={`Avg ${teamB.flag}`}
            value={sim.avgGoalsB.toFixed(2)}
          />
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {sim.summary}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
      <p className="text-lg font-black tabular-nums">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
