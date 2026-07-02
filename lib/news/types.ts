/**
 * Team-news domain types — the contract for the daily news intelligence layer.
 *
 * A TeamNewsItem is one piece of recent football news about a national team
 * (an injury, a call-up, a tactical change, …). These flow through:
 *   provider (fetch) → classifier (categorise + score) → store (MongoDB/memory)
 * and into the agent's prediction reasoning.
 */

export type NewsCategory =
  | "injury"
  | "squad"
  | "form"
  | "tactics"
  | "suspension"
  | "coach"
  | "other";

export type NewsImpact = "low" | "medium" | "high";

/**
 * Whether the item is, on balance, bad / good / neutral for the team's chances.
 * Used by the impact analyzer to know which way to nudge probabilities.
 */
export type NewsDirection = "negative" | "positive" | "neutral";

export interface TeamNewsItem {
  team: string; // team slug (matches the prediction engine)
  title: string;
  summary: string;
  category: NewsCategory;
  impactLevel: NewsImpact;
  affectedPlayers: string[];
  sourceName: string;
  sourceUrl: string;
  publishedAt: Date;
  createdAt: Date;
  /** Direction of the effect on the team's win chances. */
  direction: NewsDirection;
  /**
   * True when this is curated SAMPLE data (no live API key configured), so the
   * UI can clearly label it "Demo news data" and we never present mock items as
   * verified real news.
   */
  demo: boolean;
  /**
   * True when this item mirrors a manually-curated, sourced signal that is
   * ALREADY folded into the base model (availabilityAdjustments /
   * preMatchIntelligence). Shown in the news panel so confirmed squad news is
   * never invisible, but the news-impact analyzer SKIPS it — its effect lives
   * in the base probabilities, and counting it again would double-price it.
   */
  modelled?: boolean;
}

/** Where the news for a request ultimately came from. */
export type NewsSource = "api" | "demo";

/** Result of a refresh run. */
export interface NewsRefreshSummary {
  source: NewsSource;
  provider: string | null;
  storedTo: "mongodb" | "memory";
  teamsRefreshed: number;
  itemsRefreshed: number;
  perTeam: { team: string; count: number }[];
  ranAt: string;
  note: string;
}
