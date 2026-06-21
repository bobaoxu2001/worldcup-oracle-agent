import {
  Activity,
  Stethoscope,
  Users,
  Shield,
  Megaphone,
  Ban,
  Newspaper,
  TrendingDown,
  TrendingUp,
  Minus,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsCategory, NewsDirection, NewsImpact } from "@/lib/news/types";
import { provenanceStatus, type VerificationProvenance } from "@/lib/data-truth/provenance";

const CATEGORY_META: Record<NewsCategory, { label: string; icon: React.ReactNode }> = {
  injury: { label: "Injury", icon: <Stethoscope className="h-3 w-3" /> },
  squad: { label: "Squad", icon: <Users className="h-3 w-3" /> },
  form: { label: "Form", icon: <Activity className="h-3 w-3" /> },
  tactics: { label: "Tactics", icon: <Shield className="h-3 w-3" /> },
  suspension: { label: "Suspension", icon: <Ban className="h-3 w-3" /> },
  coach: { label: "Coach", icon: <Megaphone className="h-3 w-3" /> },
  other: { label: "Update", icon: <Newspaper className="h-3 w-3" /> },
};

export function CategoryBadge({ category }: { category: NewsCategory }) {
  const m = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {m.icon}
      {m.label}
    </span>
  );
}

export function ImpactBadge({ impact }: { impact: NewsImpact }) {
  const styles: Record<NewsImpact, string> = {
    high: "border-red-500/30 bg-red-500/10 text-red-300",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    low: "border-white/10 bg-white/[0.04] text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[impact]
      )}
    >
      {impact} impact
    </span>
  );
}

export function DirectionIcon({ direction }: { direction: NewsDirection }) {
  if (direction === "negative") return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
  if (direction === "positive") return <TrendingUp className="h-3.5 w-3.5 text-neon" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
      Demo data
    </span>
  );
}

/**
 * Compact "Verified" provenance chip — shown only when a record was cross-checked
 * against an authoritative source (renders nothing otherwise). Links to the
 * source when one is recorded; the source name is in the tooltip to stay compact.
 */
export function VerificationBadge({ provenance }: { provenance: VerificationProvenance }) {
  const s = provenanceStatus(provenance);
  if (!s.verified) return null;
  const title = s.sourceName ? `Verified · source: ${s.sourceName}` : "Verified";
  const chip = (
    <span className="inline-flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-medium text-neon">
      <BadgeCheck className="h-3 w-3" /> Verified
    </span>
  );
  return s.sourceUrl ? (
    <a
      href={s.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="transition hover:opacity-80"
    >
      {chip}
    </a>
  ) : (
    <span title={title}>{chip}</span>
  );
}

/** "3h ago" / "2d ago" relative time. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
