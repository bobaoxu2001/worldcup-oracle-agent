import { ExternalLink } from "lucide-react";
import {
  CategoryBadge,
  ImpactBadge,
  DirectionIcon,
  DemoBadge,
  InModelBadge,
  relativeTime,
} from "./news-badges";
import type { NewsItemView } from "@/lib/agent/types";

/** A single news item card — badges, summary, source, date. */
export function NewsItemCard({ item, compact }: { item: NewsItemView; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-neon/20">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <DirectionIcon direction={item.direction} />
        <ImpactBadge impact={item.impactLevel} />
        <CategoryBadge category={item.category} />
        {item.modelled && <InModelBadge />}
        {item.demo && <DemoBadge />}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {relativeTime(item.publishedAt)}
        </span>
      </div>

      <p className="text-sm font-semibold leading-snug">{item.title}</p>
      {!compact && item.summary && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
      )}

      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>{item.sourceName}</span>
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-electric hover:underline"
          >
            source <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
