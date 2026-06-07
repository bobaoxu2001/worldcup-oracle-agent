import { Newspaper } from "lucide-react";
import { NewsItemCard } from "@/components/news/news-item-card";
import type { TeamNewsView } from "@/lib/agent/types";

/** Single-team news digest, shown for the "team-news" intent. */
export function TeamNewsDigest({
  view,
  source,
}: {
  view: TeamNewsView;
  source?: "api" | "demo";
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Newspaper className="h-4 w-4 text-neon" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon">
          {view.team.flag} {view.team.name} — latest news
        </span>
        <span className="chip text-[10px]">
          {source === "demo" ? "Demo news data" : "Live news"}
        </span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{view.headline}</p>

      <div className="space-y-2">
        {view.items.length === 0 ? (
          <p className="rounded-lg bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground">
            No significant recent news found for this team right now.
          </p>
        ) : (
          view.items.map((it, i) => <NewsItemCard key={i} item={it} />)
        )}
      </div>
    </div>
  );
}
