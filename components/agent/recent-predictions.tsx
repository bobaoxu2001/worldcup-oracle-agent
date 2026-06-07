"use client";

import { Clock, Database, HardDrive } from "lucide-react";
import type { StoredPrediction, PersistMode } from "@/lib/db/mongodb";

interface Props {
  items: StoredPrediction[];
  source: PersistMode | null;
}

/** The agent's memory rail — recent prediction interactions. */
export function RecentPredictions({ items, source }: Props) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-neon" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
            Agent memory
          </span>
        </div>
        {source && (
          <span className="chip text-[10px]">
            {source === "mongodb" ? (
              <>
                <Database className="h-3 w-3" /> MongoDB
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3" /> In-memory
              </>
            )}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No predictions yet. Ask the agent something to start its memory.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it, i) => (
            <li
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-neon/20"
            >
              <p className="truncate text-sm font-medium">{it.userQuery}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {it.prediction && (
                  <span className="tabular-nums">
                    {(it.prediction.teamAWin * 100).toFixed(0)}% /{" "}
                    {(it.prediction.draw * 100).toFixed(0)}% /{" "}
                    {(it.prediction.teamBWin * 100).toFixed(0)}%
                  </span>
                )}
                {it.simulationResult && (
                  <span>
                    {it.simulationResult.simulationsRun.toLocaleString()} sims ·{" "}
                    {it.simulationResult.mostLikelyScore}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
