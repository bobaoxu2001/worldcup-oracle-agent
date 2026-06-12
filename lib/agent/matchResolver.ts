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
import { getUpdatedRating } from "@/lib/prediction-engine/ratingUpdates";
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
  korean: "south-korea", // adjective form ("korean vs 捷克")
  "korea republic": "south-korea",
  "republic of korea": "south-korea",
  rok: "south-korea",
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
  "czech": "czech-republic",
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
  // ── Spanish / Portuguese names (accents are stripped by norm) ──────────────
  alemania: "germany", // es
  alemanha: "germany", // pt
  espana: "spain", // es (España)
  espanha: "spain", // pt
  brasil: "brazil",
  francia: "france", // es
  franca: "france", // pt (França)
  inglaterra: "england",
  "paises bajos": "netherlands", // es
  "paises baixos": "netherlands", // pt
  holanda: "netherlands",
  japon: "japan", // es (Japón)
  japao: "japan", // pt (Japão)
  "estados unidos": "usa",
  belgica: "belgium",
  croacia: "croatia", // es/pt
  marruecos: "morocco", // es
  marrocos: "morocco", // pt
  "corea del sur": "south-korea", // es
  "coreia do sul": "south-korea", // pt
  "arabia saudita": "saudi-arabia",
  uruguai: "uruguay", // pt
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

/**
 * Chinese / Japanese team names → slug. Matched by substring on the raw query
 * because `norm()` strips non-Latin characters. Enables Global Voice Mode in
 * 中文 / 日本語 (voice or typed). Latin-script names (es/pt) go through ALIASES.
 */
export const CJK_ALIASES: Record<string, string> = {
  // Chinese (Simplified)
  阿根廷: "argentina",
  德国: "germany",
  巴西: "brazil",
  法国: "france",
  葡萄牙: "portugal",
  西班牙: "spain",
  英格兰: "england",
  美国: "usa",
  墨西哥: "mexico",
  荷兰: "netherlands",
  比利时: "belgium",
  克罗地亚: "croatia",
  摩洛哥: "morocco",
  韩国: "south-korea",
  韩国队: "south-korea",
  韩队: "south-korea",
  捷克: "czech-republic",
  捷克队: "czech-republic",
  乌拉圭: "uruguay",
  哥伦比亚: "colombia",
  沙特阿拉伯: "saudi-arabia",
  加拿大: "canada",
  瑞士: "switzerland",
  日本: "japan", // also valid Japanese (kanji)
  // Japanese (Katakana)
  アルゼンチン: "argentina",
  ドイツ: "germany",
  ブラジル: "brazil",
  フランス: "france",
  ポルトガル: "portugal",
  スペイン: "spain",
  イングランド: "england",
  アメリカ: "usa",
  メキシコ: "mexico",
  オランダ: "netherlands",
  ベルギー: "belgium",
  クロアチア: "croatia",
  モロッコ: "morocco",
  韓国: "south-korea",
  ウルグアイ: "uruguay",
  コロンビア: "colombia",
  カナダ: "canada",
  スイス: "switzerland",
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

// FIFA codes that are also common English words — matching them lowercase
// hijacks queries ("Can Portugal still win?" → Canada). Full names/aliases
// still match these teams; only the bare 3-letter code is skipped.
const CODE_STOPWORDS = new Set(["can", "par", "mar"]);

// Build a normalized lookup of every canonical name / code / slug.
const CANONICAL: Record<string, string> = {};
for (const t of TEAMS) {
  CANONICAL[norm(t.name)] = t.slug;
  CANONICAL[norm(t.slug.replace(/-/g, " "))] = t.slug;
  if (!CODE_STOPWORDS.has(norm(t.fifaCode))) CANONICAL[norm(t.fifaCode)] = t.slug;
}
for (const [alias, slug] of Object.entries(ALIASES)) {
  CANONICAL[norm(alias)] = slug;
}

export function teamRef(slug: string): TeamRef {
  const t = getTeam(slug);
  // Live Elo (base calibration + completed-result updates) so the agent's
  // simulator and scenario deltas start from the same rating as predictMatch.
  return { slug: t.slug, name: t.name, flag: t.flag, elo: getUpdatedRating(slug) };
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

  // CJK names (Chinese / Japanese) — substring match on the raw query, since
  // norm() strips non-Latin characters. Enables non-English voice/text input.
  const raw = query.toLowerCase();
  for (const key of Object.keys(CJK_ALIASES).sort((a, b) => b.length - a.length)) {
    const at = raw.indexOf(key);
    if (at >= 0) {
      const slug = CJK_ALIASES[key];
      if (!seen.has(slug)) {
        seen.add(slug);
        found.push({ slug, at });
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
