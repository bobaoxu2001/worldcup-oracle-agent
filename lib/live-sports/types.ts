/**
 * Types for the live tournament-state layer.
 *
 * This layer is the DETERMINISTIC source of truth for whether a team is still in
 * the tournament. It is fed by a real sports data API (API-Football), cached in
 * MongoDB, and used to gate champion/path/team analysis. The LLM/news layers
 * never decide elimination.
 */

export type TeamStatus = "active" | "qualified" | "eliminated" | "unknown";

/** How a snapshot was served (drives the UI transparency badge). */
export type StateMode = "live" | "cache" | "demo" | "unavailable";

export interface TeamState {
  slug: string; // canonical app team id
  name: string;
  status: TeamStatus;
  detail?: string; // short human reason, e.g. "Lost Round of 16 1-2"
}

export interface LiveFixture {
  id: number;
  round: string; // e.g. "Group A - 1", "Round of 16", "Final"
  status: string; // API short status, e.g. "FT", "NS", "AET", "PEN"
  homeSlug: string | null;
  awaySlug: string | null;
  goalsHome: number | null;
  goalsAway: number | null;
  homeWinner: boolean | null;
  awayWinner: boolean | null;
  date: string;
}

export interface LiveInjury {
  slug: string | null; // canonical team id (null if unmapped)
  team: string;
  player: string;
  reason: string;
  type?: string;
  date?: string;
}

/** A normalized, cacheable snapshot of tournament state. */
export interface TournamentStateSnapshot {
  mode: StateMode;
  source: string; // "API-Football" | "MongoDB cache" | "demo"
  fetchedAt: string | null; // ISO
  expiresAt: string | null; // ISO
  confidence: number; // 0..1
  teams: TeamState[];
  eliminatedSlugs: string[];
  eliminatedCount: number;
}

/** Compact view passed to the UI / API responses (no heavy arrays). */
export interface TournamentStateView {
  mode: StateMode;
  source: string;
  fetchedAt: string | null;
  eliminatedCount: number;
  confidence: number;
}
