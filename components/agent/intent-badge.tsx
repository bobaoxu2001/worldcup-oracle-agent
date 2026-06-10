import {
  Swords,
  Trophy,
  Table2,
  Map,
  BarChart3,
  Scale,
  Newspaper,
  BookOpen,
  Cpu,
  HelpCircle,
  Film,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentIntent } from "@/lib/agent/types";

const META: Record<string, { label: string; icon: React.ReactNode; accent?: boolean }> = {
  "match-prediction": { label: "Match Prediction", icon: <Swords className="h-3 w-3" />, accent: true },
  "champion-odds": { label: "Tournament Forecast", icon: <Trophy className="h-3 w-3" />, accent: true },
  "group-qualification": { label: "Group Qualification", icon: <Table2 className="h-3 w-3" />, accent: true },
  "path-analysis": { label: "Path Analysis", icon: <Map className="h-3 w-3" />, accent: true },
  "team-analysis": { label: "Team Analysis", icon: <BarChart3 className="h-3 w-3" /> },
  "team-comparison": { label: "Team Comparison", icon: <Scale className="h-3 w-3" /> },
  "team-news": { label: "News Analysis", icon: <Newspaper className="h-3 w-3" /> },
  "rules-explanation": { label: "Rules Explanation", icon: <BookOpen className="h-3 w-3" /> },
  "model-explanation": { label: "Model Explanation", icon: <Cpu className="h-3 w-3" /> },
  scenario: { label: "Scenario Re-analysis", icon: <RefreshCw className="h-3 w-3" /> },
  "tiktok-preview": { label: "Social Preview", icon: <Film className="h-3 w-3" /> },
  unknown: { label: "Clarification", icon: <HelpCircle className="h-3 w-3" /> },
};

/** Short label for an intent (used by memory lists). */
export function intentLabel(intent?: string): string {
  return (intent && META[intent]?.label) || "Session";
}

/** Compact badge naming the analysis type the agent ran. */
export function IntentBadge({ intent }: { intent: AgentIntent | string }) {
  const m = META[intent] ?? META.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        m.accent
          ? "border-neon/30 bg-neon/[0.07] text-neon"
          : "border-white/10 bg-white/[0.04] text-muted-foreground"
      )}
    >
      {m.icon}
      {m.label}
    </span>
  );
}
