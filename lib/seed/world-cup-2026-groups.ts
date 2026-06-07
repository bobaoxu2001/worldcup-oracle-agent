/**
 * World Cup 2026 — REAL group draw seed data.
 *
 * Source: FIFA World Cup 2026 Final Draw, held 5 December 2025 at the
 * John F. Kennedy Center, Washington D.C. 48 teams · 12 groups (A–L) ·
 * 4 teams per group. Hosts: Mexico (A1), Canada (B1), USA (D1).
 *
 * This file is the SINGLE editable source of truth for teams, groups and
 * group membership. Edit here to update the whole app. Inter-confederation /
 * UEFA-path play-off winners (resolved March 2026) are included as their
 * qualified teams: Czech Republic, Bosnia & Herzegovina, Türkiye, Sweden, Iraq.
 *
 * `slug` MUST match the keys used by the prediction engine's Elo ratings
 * (see lib/prediction-engine/ratings.ts).
 */

export type Confederation =
  | "UEFA"
  | "CONMEBOL"
  | "CONCACAF"
  | "CAF"
  | "AFC"
  | "OFC";

export interface SeedTeam {
  slug: string; // stable id, matches Elo ratings keys
  name: string;
  fifaCode: string; // 3-letter FIFA code
  confederation: Confederation;
  flag: string; // emoji
}

export interface SeedGroup {
  name: string; // "A" .. "L"
  /** Team slugs in their drawn positions 1–4. */
  teams: [string, string, string, string];
}

// TODO(prod): confirm display names against official FIFA branding before
// launch (e.g. "Türkiye" vs "Turkey", "IR Iran", "Korea Republic"). `slug` and
// `fifaCode` are stable keys and should NOT change with display-name tweaks.
export const TEAMS: SeedTeam[] = [
  // Group A
  { slug: "mexico", name: "Mexico", fifaCode: "MEX", confederation: "CONCACAF", flag: "🇲🇽" },
  { slug: "south-africa", name: "South Africa", fifaCode: "RSA", confederation: "CAF", flag: "🇿🇦" },
  { slug: "south-korea", name: "South Korea", fifaCode: "KOR", confederation: "AFC", flag: "🇰🇷" },
  { slug: "czech-republic", name: "Czech Republic", fifaCode: "CZE", confederation: "UEFA", flag: "🇨🇿" },
  // Group B
  { slug: "canada", name: "Canada", fifaCode: "CAN", confederation: "CONCACAF", flag: "🇨🇦" },
  { slug: "bosnia-and-herzegovina", name: "Bosnia & Herzegovina", fifaCode: "BIH", confederation: "UEFA", flag: "🇧🇦" },
  { slug: "qatar", name: "Qatar", fifaCode: "QAT", confederation: "AFC", flag: "🇶🇦" },
  { slug: "switzerland", name: "Switzerland", fifaCode: "SUI", confederation: "UEFA", flag: "🇨🇭" },
  // Group C
  { slug: "brazil", name: "Brazil", fifaCode: "BRA", confederation: "CONMEBOL", flag: "🇧🇷" },
  { slug: "morocco", name: "Morocco", fifaCode: "MAR", confederation: "CAF", flag: "🇲🇦" },
  { slug: "haiti", name: "Haiti", fifaCode: "HAI", confederation: "CONCACAF", flag: "🇭🇹" },
  { slug: "scotland", name: "Scotland", fifaCode: "SCO", confederation: "UEFA", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  { slug: "usa", name: "United States", fifaCode: "USA", confederation: "CONCACAF", flag: "🇺🇸" },
  { slug: "paraguay", name: "Paraguay", fifaCode: "PAR", confederation: "CONMEBOL", flag: "🇵🇾" },
  { slug: "australia", name: "Australia", fifaCode: "AUS", confederation: "AFC", flag: "🇦🇺" },
  { slug: "turkey", name: "Türkiye", fifaCode: "TUR", confederation: "UEFA", flag: "🇹🇷" },
  // Group E
  { slug: "germany", name: "Germany", fifaCode: "GER", confederation: "UEFA", flag: "🇩🇪" },
  { slug: "curacao", name: "Curaçao", fifaCode: "CUW", confederation: "CONCACAF", flag: "🇨🇼" },
  { slug: "ivory-coast", name: "Ivory Coast", fifaCode: "CIV", confederation: "CAF", flag: "🇨🇮" },
  { slug: "ecuador", name: "Ecuador", fifaCode: "ECU", confederation: "CONMEBOL", flag: "🇪🇨" },
  // Group F
  { slug: "netherlands", name: "Netherlands", fifaCode: "NED", confederation: "UEFA", flag: "🇳🇱" },
  { slug: "japan", name: "Japan", fifaCode: "JPN", confederation: "AFC", flag: "🇯🇵" },
  { slug: "sweden", name: "Sweden", fifaCode: "SWE", confederation: "UEFA", flag: "🇸🇪" },
  { slug: "tunisia", name: "Tunisia", fifaCode: "TUN", confederation: "CAF", flag: "🇹🇳" },
  // Group G
  { slug: "belgium", name: "Belgium", fifaCode: "BEL", confederation: "UEFA", flag: "🇧🇪" },
  { slug: "egypt", name: "Egypt", fifaCode: "EGY", confederation: "CAF", flag: "🇪🇬" },
  { slug: "iran", name: "Iran", fifaCode: "IRN", confederation: "AFC", flag: "🇮🇷" },
  { slug: "new-zealand", name: "New Zealand", fifaCode: "NZL", confederation: "OFC", flag: "🇳🇿" },
  // Group H
  { slug: "spain", name: "Spain", fifaCode: "ESP", confederation: "UEFA", flag: "🇪🇸" },
  { slug: "cape-verde", name: "Cape Verde", fifaCode: "CPV", confederation: "CAF", flag: "🇨🇻" },
  { slug: "saudi-arabia", name: "Saudi Arabia", fifaCode: "KSA", confederation: "AFC", flag: "🇸🇦" },
  { slug: "uruguay", name: "Uruguay", fifaCode: "URU", confederation: "CONMEBOL", flag: "🇺🇾" },
  // Group I
  { slug: "france", name: "France", fifaCode: "FRA", confederation: "UEFA", flag: "🇫🇷" },
  { slug: "senegal", name: "Senegal", fifaCode: "SEN", confederation: "CAF", flag: "🇸🇳" },
  { slug: "iraq", name: "Iraq", fifaCode: "IRQ", confederation: "AFC", flag: "🇮🇶" },
  { slug: "norway", name: "Norway", fifaCode: "NOR", confederation: "UEFA", flag: "🇳🇴" },
  // Group J
  { slug: "argentina", name: "Argentina", fifaCode: "ARG", confederation: "CONMEBOL", flag: "🇦🇷" },
  { slug: "algeria", name: "Algeria", fifaCode: "ALG", confederation: "CAF", flag: "🇩🇿" },
  { slug: "austria", name: "Austria", fifaCode: "AUT", confederation: "UEFA", flag: "🇦🇹" },
  { slug: "jordan", name: "Jordan", fifaCode: "JOR", confederation: "AFC", flag: "🇯🇴" },
  // Group K
  { slug: "portugal", name: "Portugal", fifaCode: "POR", confederation: "UEFA", flag: "🇵🇹" },
  { slug: "dr-congo", name: "DR Congo", fifaCode: "COD", confederation: "CAF", flag: "🇨🇩" },
  { slug: "uzbekistan", name: "Uzbekistan", fifaCode: "UZB", confederation: "AFC", flag: "🇺🇿" },
  { slug: "colombia", name: "Colombia", fifaCode: "COL", confederation: "CONMEBOL", flag: "🇨🇴" },
  // Group L
  { slug: "england", name: "England", fifaCode: "ENG", confederation: "UEFA", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { slug: "croatia", name: "Croatia", fifaCode: "CRO", confederation: "UEFA", flag: "🇭🇷" },
  { slug: "ghana", name: "Ghana", fifaCode: "GHA", confederation: "CAF", flag: "🇬🇭" },
  { slug: "panama", name: "Panama", fifaCode: "PAN", confederation: "CONCACAF", flag: "🇵🇦" },
];

export const GROUPS: SeedGroup[] = [
  { name: "A", teams: ["mexico", "south-africa", "south-korea", "czech-republic"] },
  { name: "B", teams: ["canada", "bosnia-and-herzegovina", "qatar", "switzerland"] },
  { name: "C", teams: ["brazil", "morocco", "haiti", "scotland"] },
  { name: "D", teams: ["usa", "paraguay", "australia", "turkey"] },
  { name: "E", teams: ["germany", "curacao", "ivory-coast", "ecuador"] },
  { name: "F", teams: ["netherlands", "japan", "sweden", "tunisia"] },
  { name: "G", teams: ["belgium", "egypt", "iran", "new-zealand"] },
  { name: "H", teams: ["spain", "cape-verde", "saudi-arabia", "uruguay"] },
  { name: "I", teams: ["france", "senegal", "iraq", "norway"] },
  { name: "J", teams: ["argentina", "algeria", "austria", "jordan"] },
  { name: "K", teams: ["portugal", "dr-congo", "uzbekistan", "colombia"] },
  { name: "L", teams: ["england", "croatia", "ghana", "panama"] },
];

/** Host nations get a home-field Elo bonus in the prediction engine. */
export const HOST_SLUGS = new Set(["usa", "mexico", "canada"]);

const TEAM_BY_SLUG = new Map(TEAMS.map((t) => [t.slug, t]));

export function getTeam(slug: string): SeedTeam {
  const t = TEAM_BY_SLUG.get(slug);
  if (!t) throw new Error(`Unknown team slug: ${slug}`);
  return t;
}

export function getGroup(name: string): SeedGroup {
  const g = GROUPS.find((x) => x.name === name.toUpperCase());
  if (!g) throw new Error(`Unknown group: ${name}`);
  return g;
}

/** Which group a team plays in. */
export function groupOf(slug: string): SeedGroup {
  const g = GROUPS.find((x) => x.teams.includes(slug));
  if (!g) throw new Error(`Team not in any group: ${slug}`);
  return g;
}
