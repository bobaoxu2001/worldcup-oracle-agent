import { Trophy, Target, AlertTriangle, Gauge, Zap } from "lucide-react";
import { ProbabilityBars } from "./probability-bars";
import { ratingUpdatesMeta } from "@/lib/prediction-engine/ratingUpdates";
import { cn } from "@/lib/utils";
import type { PredictionResult } from "@/lib/agent/types";

/** The headline prediction result card. */
export function PredictionCard({ p }: { p: PredictionResult }) {
  const { resultsUsed } = ratingUpdatesMeta();
  return (
    <div className="glass glass-hover rounded-2xl p-5">
      {/* matchup header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <TeamBadge flag={p.teamA.flag} name={p.teamA.name} elo={p.teamA.elo} align="left" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Prediction
          </span>
          <span className="text-lg font-black text-muted-foreground/60">VS</span>
        </div>
        <TeamBadge flag={p.teamB.flag} name={p.teamB.name} elo={p.teamB.elo} align="right" />
      </div>

      <ProbabilityBars
        teamA={p.teamA}
        teamB={p.teamB}
        teamAWin={p.teamAWin}
        draw={p.draw}
        teamBWin={p.teamBWin}
      />

      {/* stat tiles */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Trophy className="h-4 w-4" />} label="Favorite" value={p.favorite} accent />
        <Stat icon={<Target className="h-4 w-4" />} label="Likely score" value={p.mostLikelyScore} />
        <Stat
          icon={<Gauge className="h-4 w-4" />}
          label="Confidence"
          value={`${p.confidenceLevel}`}
          sub={`${p.confidenceScore}/100`}
        />
        <Stat
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Upset prob."
          value={`${(p.upsetProbability * 100).toFixed(0)}%`}
        />
      </div>

      {resultsUsed > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <Zap className="h-3 w-3 text-neon/70" />
          Live Elo — ratings updated from {resultsUsed} completed result
          {resultsUsed === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function TeamBadge({
  flag,
  name,
  elo,
  align,
}: {
  flag: string;
  name: string;
  elo: number;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-0.5", align === "right" && "items-end text-right")}>
      <span className="text-3xl leading-none sm:text-4xl">{flag}</span>
      <span className="text-sm font-bold leading-tight sm:text-base">{name}</span>
      <span className="text-[11px] font-medium text-muted-foreground">Elo {elo}</span>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3",
        accent && "border-neon/20 bg-neon/[0.04]"
      )}
    >
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        <span className={cn(accent && "text-neon")}>{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-sm font-bold leading-tight", accent && "text-neon")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
