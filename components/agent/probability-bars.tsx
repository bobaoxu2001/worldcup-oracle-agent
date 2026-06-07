import { cn } from "@/lib/utils";

interface Props {
  teamA: { name: string; flag: string };
  teamB: { name: string; flag: string };
  teamAWin: number;
  draw: number;
  teamBWin: number;
}

/** Three stacked, animated probability bars: Team A win / Draw / Team B win. */
export function ProbabilityBars({ teamA, teamB, teamAWin, draw, teamBWin }: Props) {
  const rows = [
    { label: `${teamA.flag} ${teamA.name} win`, value: teamAWin, color: "bg-neon", glow: "shadow-glow" },
    { label: "Draw", value: draw, color: "bg-white/40", glow: "" },
    { label: `${teamB.flag} ${teamB.name} win`, value: teamBWin, color: "bg-electric", glow: "shadow-glow-blue" },
  ];
  const max = Math.max(teamAWin, draw, teamBWin);

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const isTop = r.value === max;
        return (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={cn("font-medium", isTop ? "text-foreground" : "text-muted-foreground")}>
                {r.label}
              </span>
              <span className={cn("tabular-nums font-bold", isTop ? "text-foreground" : "text-muted-foreground")}>
                {(r.value * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", r.color, isTop && r.glow)}
                style={{ width: `${Math.max(r.value * 100, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
