"use client";

import { useState } from "react";
import { Cpu, Play, Loader2, Wrench, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  resultSummary: string;
}
interface TraceResponse {
  available: boolean;
  settled?: boolean;
  answer?: string;
  rounds?: number;
  toolCalls?: ToolCall[];
  note?: string;
  reason?: string;
}

/** Friendly label + one-line "what it does" for each declared tool. */
const TOOL_META: Record<string, { label: string; blurb: string }> = {
  resolve_team: { label: "resolve_team", blurb: "map a casual name to a canonical 2026 team" },
  predict_match: { label: "predict_match", blurb: "run the deterministic Elo → Dixon-Coles → Monte Carlo engine" },
  get_team_news: { label: "get_team_news", blurb: "pull classified injury / squad news signals" },
  get_tournament_state: { label: "get_tournament_state", blurb: "read the live elimination source of truth" },
};

function argsPreview(args: Record<string, unknown>): string {
  const vals = Object.values(args).filter((v) => v !== undefined && v !== null && v !== "");
  return vals.map((v) => String(v)).join(", ");
}

/**
 * Opt-in panel that runs the LIVE Gemini function-calling loop for this question
 * and renders the tool-use trace: which tools Gemini chose, in what order, and
 * what each deterministic tool returned. The engine still owns every number —
 * this shows Gemini *orchestrating* the tools, not inventing facts.
 *
 * Only rendered when the loop is enabled (a Gemini key is configured); it is a
 * separate, on-demand call so it never adds latency to the main prediction.
 */
export function GeminiToolTrace({ query }: { query: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "failed">("idle");
  const [data, setData] = useState<TraceResponse | null>(null);

  const run = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/agent/gemini-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const d = (await res.json()) as TraceResponse;
      setData(d);
      setState(d.settled && d.toolCalls?.length ? "done" : "failed");
    } catch {
      setState("failed");
      setData({ available: true, note: "The tool loop could not be reached — the deterministic answer above still stands." });
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Cpu className="h-4 w-4 text-electric" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-electric">
          Gemini function-calling
        </span>
        <span className="chip text-[10px] text-muted-foreground">live tool use</span>
        {state === "idle" && (
          <button
            onClick={run}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-electric/30 bg-electric/[0.08] px-3 py-1.5 text-xs font-semibold text-electric transition hover:border-electric/50 hover:bg-electric/[0.15]"
          >
            <Play className="h-3.5 w-3.5" /> Watch Gemini drive the tools
          </button>
        )}
        {state === "loading" && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Gemini is choosing tools…
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Beyond narrating, <strong className="text-foreground">Gemini can drive the pipeline</strong>:
        it chooses which deterministic tools to call, we run them, and it answers from their outputs.
        Every number still comes from the engine — Gemini orchestrates, it never invents.
      </p>

      {/* trace */}
      {(state === "done" || state === "failed") && data && (
        <div className="mt-4">
          {data.toolCalls && data.toolCalls.length > 0 && (
            <ol className="space-y-2">
              {data.toolCalls.map((tc, i) => {
                const meta = TOOL_META[tc.name] ?? { label: tc.name, blurb: "" };
                const a = argsPreview(tc.args);
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-electric/10 text-electric">
                      <Wrench className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-electric">
                          {meta.label}
                          {a ? `(${a})` : "()"}
                        </code>
                        {meta.blurb && <span className="text-[11px] text-muted-foreground">{meta.blurb}</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/80">
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="tabular-nums">{tc.resultSummary}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                      #{i + 1}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {state === "done" && data.answer && (
            <div className="mt-3 rounded-xl border border-electric/20 bg-electric/[0.05] px-4 py-3">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-electric">
                <CheckCircle2 className="h-3.5 w-3.5" /> Gemini&apos;s answer
                {typeof data.rounds === "number" && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {data.rounds} round{data.rounds === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{data.answer}</p>
            </div>
          )}

          {state === "failed" && (
            <div className="mt-1 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2.5 text-xs text-amber-200/90">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {data.note ||
                  "Gemini didn't settle on a tool-driven answer this time — the deterministic answer above is unchanged."}
              </span>
            </div>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/60">
            Inspectable at <code className="font-mono">POST /api/agent/gemini-tools</code>. Tools return
            the engine&apos;s own probabilities and the live elimination state; a system instruction
            forbids inventing probabilities, news, or eliminations.
          </p>
        </div>
      )}
    </div>
  );
}
