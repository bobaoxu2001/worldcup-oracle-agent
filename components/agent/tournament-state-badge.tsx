import { Radio, Database, FlaskConical, CircleOff } from "lucide-react";
import type { TournamentStateView } from "@/lib/live-sports/types";

const META: Record<
  TournamentStateView["mode"],
  { label: string; icon: typeof Radio; accent: string }
> = {
  live: { label: "Live API", icon: Radio, accent: "text-neon" },
  cache: { label: "Cached", icon: Database, accent: "text-sky-400" },
  demo: { label: "Demo", icon: FlaskConical, accent: "text-amber-400" },
  unavailable: { label: "Unavailable", icon: CircleOff, accent: "text-muted-foreground" },
};

/** Transparency badge for the live tournament-state layer. */
export function TournamentStateBadge({ state }: { state: TournamentStateView }) {
  const m = META[state.mode];
  const Icon = m.icon;
  const updated = state.fetchedAt
    ? new Date(state.fetchedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Icon className={`h-4 w-4 ${m.accent}`} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          Tournament state
        </span>
        <span className={`chip text-[10px] ${m.accent}`}>{m.label}</span>
        {state.eliminatedCount > 0 && (
          <span className="chip ml-auto text-[10px] text-red-400">
            {state.eliminatedCount} eliminated
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Field label="Source" value={state.source} />
        <Field label="Last updated" value={updated} />
        <Field label="Eliminated" value={String(state.eliminatedCount)} />
      </div>
      {state.mode === "demo" && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
          No live data source configured — all teams treated as active. Set <code>API_FOOTBALL_KEY</code> for live
          fixtures, standings &amp; eliminations.
        </p>
      )}
      {state.mode === "unavailable" && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
          Live tournament state is temporarily unavailable — no eliminations are inferred.
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}
