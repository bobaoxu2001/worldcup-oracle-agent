/**
 * Match Data Resolver — the agent's "entity recognition" step.
 *
 * Takes a free-text football question and figures out WHICH teams the user is
 * talking about, mapping casual names ("USA", "Türkiye", "the Netherlands") to
 * the canonical team slugs the prediction engine understands.
 *
 * Deterministic and dependency-free so the demo never relies on an LLM to do
 * something a lookup table does perfectly.
 */

import { TEAMS, getTeam } from "@/lib/seed/world-cup-2026-groups";
import { getRating } from "@/lib/prediction-engine/ratings";
import type { TeamRef } from "./types";

/** Extra casual aliases → slug. Canonical names/codes are matched automatically. */
const ALIASES: Record<string, string> = {
  usa: "usa",
  "united states": "usa",
  "the states": "usa",
  america: "usa",
  "team usa": "usa",
  holland: "netherlands",
  "the netherlands": "netherlands",
  dutch: "netherlands",
  turkiye: "turkey",
  türkiye: "turkey",
  "south korea": "south-korea",
  korea: "south-korea",
  "korea republic": "south-korea",
  "saudi arabia": "saudi-arabia",
  "saudis": "saudi-arabia",
  "ivory coast": "ivory-coast",
  "cote divoire": "ivory-coast",
  "cote d'ivoire": "ivory-coast",
  "cape verde": "cape-verde",
  "dr congo": "dr-congo",
  "congo": "dr-congo",
  "drc": "dr-congo",
  "czechia": "czech-republic",
  "czech republic": "czech-republic",
  "bosnia": "bosnia-and-herzegovina",
  "new zealand": "new-zealand",
  "south africa": "south-africa",
  "three lions": "england",
  "la albiceleste": "argentina",
  "selecao": "brazil",
  "les bleus": "france",
  "die mannschaft": "germany",
  "la roja": "spain",
};

/** Star player → national team slug, for scenario detection ("what if X is out"). */
export const PLAYER_TO_TEAM: Record<string, string> = {
  messi: "argentina",
  "lionel messi": "argentina",
  ronaldo: "portugal",
  "cristiano ronaldo": "portugal",
  cr7: "portugal",
  mbappe: "france",
  "kylian mbappe": "france",
  haaland: "norway",
  "erling haaland": "norway",
  vinicius: "brazil",
  "vinicius jr": "brazil",
  neymar: "brazil",
  bellingham: "england",
  "jude bellingham": "england",
  kane: "england",
  "harry kane": "england",
  pulisic: "usa",
  "christian pulisic": "usa",
  modric: "croatia",
  "luka modric": "croatia",
  lautaro: "argentina",
  yamal: "spain",
  "lamine yamal": "spain",
  musiala: "germany",
  kvaratskhelia: "georgia",
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Build a normalized lookup of every canonical name / code / slug.
const CANONICAL: Record<string, string> = {};
for (const t of TEAMS) {
  CANONICAL[norm(t.name)] = t.slug;
  CANONICAL[norm(t.slug.replace(/-/g, " "))] = t.slug;
  CANONICAL[norm(t.fifaCode)] = t.slug;
}
for (const [alias, slug] of Object.entries(ALIASES)) {
  CANONICAL[norm(alias)] = slug;
}

export function teamRef(slug: string): TeamRef {
  const t = getTeam(slug);
  return { slug: t.slug, name: t.name, flag: t.flag, elo: getRating(slug) };
}

/**
 * Find up to two teams mentioned in the query, in order of appearance.
 * Greedy longest-match so "south korea" beats a stray "korea".
 */
export function resolveTeams(query: string): TeamRef[] {
  const q = norm(query);
  const found: { slug: string; at: number }[] = [];
  const seen = new Set<string>();

  // Sort aliases by length desc so multi-word names win.
  const keys = Object.keys(CANONICAL).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    const m = q.match(re);
    if (m && m.index !== undefined) {
      const slug = CANONICAL[key];
      if (!seen.has(slug)) {
        seen.add(slug);
        found.push({ slug, at: m.index });
      }
    }
  }

  return found
    .sort((a, b) => a.at - b.at)
    .slice(0, 2)
    .map((f) => teamRef(f.slug));
}

/** Detect a star player named in the query and the team they belong to. */
export function resolvePlayer(query: string): { player: string; slug: string } | null {
  const q = norm(query);
  const keys = Object.keys(PLAYER_TO_TEAM).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (new RegExp(`\\b${key}\\b`).test(q)) {
      return { player: key.replace(/\b\w/g, (c) => c.toUpperCase()), slug: PLAYER_TO_TEAM[key] };
    }
  }
  return null;
}
