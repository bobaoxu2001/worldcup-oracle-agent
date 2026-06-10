import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StructuredResult } from "@/lib/agent/types";

/**
 * Model Dimensions / Prediction Factors card — renders the structured factors
 * behind a non-matchup answer (team analysis, comparison, path, group, model).
 */
export function FactorsCard({ structured }: { structured: StructuredResult }) {
  if (!structured.modelFactors.length) return null;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4 text-neon" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Model dimensions / prediction factors
        </span>
        <span className="chip ml-auto text-[10px]">confidence {structured.confidence}/100</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {structured.modelFactors.map((f) => (
          <div
            key={f.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {f.label}
            </span>
            <span
              className={cn(
                "text-right text-xs font-semibold",
                f.weight === "high" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {structured.rulesApplied.length > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
          <span className="font-semibold text-muted-foreground">Rules applied:</span>{" "}
          {structured.rulesApplied.join(" · ")}
        </p>
      )}
      {structured.limitations.length > 0 && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
          <span className="font-semibold text-muted-foreground">Limitations:</span>{" "}
          {structured.limitations.join(" ")}
        </p>
      )}
    </div>
  );
}
