import { Trophy } from "lucide-react";
import type { ChampionAnswer } from "@/lib/agent/types";

/** Leaderboard of title contenders from the full-tournament Monte Carlo. */
export function ChampionBoard({ c }: { c: ChampionAnswer }) {
  const max = Math.max(...c.contenders.map((t) => t.champion), 0.01);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-neon" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
            Title contenders
          </span>
        </div>
        <span className="chip text-[10px]">
          {c.simulationsRun.toLocaleString()} tournament sims
        </span>
      </div>

      <div className="space-y-2.5">
        {c.contenders.map((t, i) => (
          <div key={t.slug} className="flex items-center gap-3">
            <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
            <span className="text-xl">{t.flag}</span>
            <span className="w-28 shrink-0 truncate text-sm font-semibold">{t.name}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon to-electric"
                style={{ width: `${(t.champion / max) * 100}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums">
              {(t.champion * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
