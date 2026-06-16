/**
 * Tactical-matchup (playstyle "PK") signal — a PER-FIXTURE, asymmetric Elo
 * nudge for STYLE CLASHES that a team-level rating cannot capture.
 *
 * WHY THIS EXISTS, separate from every other layer:
 *   • ratings / ratingUpdates / availability / confederationForm are all
 *     TEAM-LEVEL — they move a team's strength the same amount versus anyone.
 *   • But football has matchup effects that are NOT about who is "better":
 *     a disciplined low block can frustrate a side that dominates the ball but
 *     has no clean way through it, while barely troubling a direct, transitional
 *     opponent. The 15 June opener is the textbook case — Spain had 27 shots and
 *     could not break Cape Verde's bus (0-0). Raw Elo says Spain ~80%; the style
 *     clash says "this is exactly the kind of game Spain labour in."
 *
 * The model (deliberately simple, transparent, capped):
 *   Each team carries two 0–5 style attributes:
 *     • lowBlock  — quality/resilience of a deep, compact defensive block
 *                   (how well it can sit in and frustrate a stronger side).
 *     • breakdown — ability to BREAK a packed defence (patient creation, width,
 *                   set-piece threat, individual unlockers).
 *   For a fixture A vs B:
 *     frustrationOnA = max(0, B.lowBlock − A.breakdown)   // B's bus vs A's key
 *     frustrationOnB = max(0, A.lowBlock − B.breakdown)
 *     netForA        = WEIGHT × (frustrationOnB − frustrationOnA)
 *     a = clamp(netForA, ±CAP),  b = −a            (zero-sum within the fixture)
 *   So a side gains when it frustrates its opponent MORE than it is frustrated.
 *   A favourite who is genuinely good at unpicking blocks (high breakdown) is
 *   barely dented by a bus; one who is not (Spain, esp. without Yamal) is.
 *
 * Honesty notes:
 *   • This is a SCOUTING-style prior, not a calibrated finding. Attributes are
 *     a transparent judgement from public tactical profiles + observed results,
 *     documented per team below; the UI labels it as such.
 *   • Teams without a documented profile default to NEUTRAL (2/2), so a clash
 *     only fires when at least one side is genuinely off-neutral — most
 *     fixtures get exactly zero from this layer.
 *   • It is applied ONLY inside fixture sampling (predictMatch + the Monte Carlo
 *     match calls), never folded into a team's standalone effective rating.
 *
 * Last updated: 2026-06-16.
 */

import { getTeam } from "@/lib/seed/world-cup-2026-groups";

export interface TacticalStyle {
  /** 0–5: quality/resilience of a deep, compact low block. */
  lowBlock: number;
  /** 0–5: ability to break down a packed defence. */
  breakdown: number;
  /** Short scouting rationale (shown in transparency UI). */
  note: string;
}

/** Elo points per unit of net style "frustration" (before the cap). */
export const TACTICAL_CLASH_WEIGHT = 12;
/**
 * Max absolute Elo the tactical-matchup signal may move either side. Capped so a
 * style clash can swing a tight game but never overturn a big strength gap —
 * a low block makes Spain–Cape Verde harder, it does not make it a coin-flip.
 */
export const TACTICAL_CAP = 30;

/** League-average baseline for teams without a documented style profile. */
export const NEUTRAL_STYLE: TacticalStyle = {
  lowBlock: 2,
  breakdown: 2,
  note: "No documented style profile — treated as tactically neutral.",
};

/**
 * Documented style profiles. Only teams with a clear, sourced tactical identity
 * deviate from neutral; everyone else inherits NEUTRAL_STYLE.
 */
export const TEAM_STYLES: Record<string, TacticalStyle> = {
  // ── Elite low blocks (frustrate possession sides) ───────────────────────
  "cape-verde": { lowBlock: 5, breakdown: 1, note: "Debutants' disciplined low block + Vozinha held Spain to 0-0 on 27 shots; little going forward." },
  morocco: { lowBlock: 4, breakdown: 2, note: "2022 semi-finalists' defensive organisation; held Brazil 1-1 in the opener." },
  iran: { lowBlock: 4, breakdown: 2, note: "Classic deep, compact block; dangerous mainly in transition." },

  // ── Solid, well-organised mid/low blocks ────────────────────────────────
  uruguay: { lowBlock: 3, breakdown: 3, note: "Bielsa structure — compact and can also create; CB injuries blunt the block." },
  egypt: { lowBlock: 3, breakdown: 2, note: "Sat deep and frustrated Belgium 1-1; threat largely on the break." },
  japan: { lowBlock: 3, breakdown: 3, note: "Well-drilled, sharp in transition." },
  croatia: { lowBlock: 3, breakdown: 3, note: "Midfield control + game management." },
  senegal: { lowBlock: 3, breakdown: 3, note: "Physical, organised, dangerous in transition." },
  switzerland: { lowBlock: 3, breakdown: 2, note: "Tournament-tough defensive block." },
  algeria: { lowBlock: 3, breakdown: 3, note: "Compact with quick attacking transitions." },
  "ivory-coast": { lowBlock: 3, breakdown: 3, note: "Athletic, organised, AFCON-winning structure." },
  tunisia: { lowBlock: 3, breakdown: 2, note: "Disciplined low block, limited creativity." },
  "saudi-arabia": { lowBlock: 3, breakdown: 2, note: "Deep block + counters; held Uruguay 1-1." },
  "south-korea": { lowBlock: 3, breakdown: 3, note: "Energetic press/block, transition threat." },
  australia: { lowBlock: 3, breakdown: 2, note: "Physical, compact, set-piece reliant." },
  iraq: { lowBlock: 3, breakdown: 2, note: "Compact defensive block." },
  jordan: { lowBlock: 3, breakdown: 2, note: "Deep block, counterattacking." },
  "new-zealand": { lowBlock: 3, breakdown: 2, note: "Physical, organised; held Iran 2-2." },

  // ── Possession sides that can struggle to break a bus ───────────────────
  spain: { lowBlock: 1, breakdown: 3, note: "Elite possession but labours vs deep blocks (Rodri: 'they don't get past midfield'); Yamal is the difference-maker." },
  germany: { lowBlock: 1, breakdown: 3, note: "Dominates the ball; can stall against compact defences." },

  // ── Possession sides with elite block-breaking (quality unlocks buses) ──
  france: { lowBlock: 2, breakdown: 4, note: "Individual quality (Mbappé) routinely unpicks low blocks." },
  brazil: { lowBlock: 2, breakdown: 4, note: "Individual brilliance + width to break packed defences." },
  argentina: { lowBlock: 2, breakdown: 4, note: "Messi-class creation + set-piece threat." },
  england: { lowBlock: 2, breakdown: 4, note: "Set-piece menace + width to crack low blocks." },
  portugal: { lowBlock: 2, breakdown: 3, note: "Heavy possession with match-winners." },
  netherlands: { lowBlock: 2, breakdown: 3, note: "Possession-based, decent variety." },
  belgium: { lowBlock: 2, breakdown: 3, note: "Creative core but was blunted by Egypt's block in the opener." },
  colombia: { lowBlock: 2, breakdown: 3, note: "Possession + creativity through the lines." },
};

export function getStyle(slug: string): TacticalStyle {
  return TEAM_STYLES[slug] ?? NEUTRAL_STYLE;
}

export interface TacticalMatchup {
  /** Per-side Elo nudge for THIS fixture (a = −b, zero-sum). */
  a: number;
  b: number;
  /** How much each side is frustrated by the other's block (0–5). */
  frustrationOnA: number;
  frustrationOnB: number;
  /** Whether the layer fired for this fixture. */
  active: boolean;
  /** Human-readable one-liner for the model factor / UI. */
  summary: string;
}

function clampCap(x: number): number {
  return Math.max(-TACTICAL_CAP, Math.min(TACTICAL_CAP, Math.round(x)));
}

/**
 * Tactical style-clash Elo nudge for a fixture A vs B. Returns {a, b} to add to
 * each side's effective rating for THIS match only (a = −b).
 */
export function getTacticalMatchup(aSlug: string, bSlug: string): TacticalMatchup {
  const A = getStyle(aSlug);
  const B = getStyle(bSlug);

  const frustrationOnA = Math.max(0, B.lowBlock - A.breakdown);
  const frustrationOnB = Math.max(0, A.lowBlock - B.breakdown);
  const a = clampCap(TACTICAL_CLASH_WEIGHT * (frustrationOnB - frustrationOnA));
  const b = -a;

  const active = a !== 0;
  let summary: string;
  if (!active) {
    summary = "Styles are tactically neutral — no matchup edge either way.";
  } else {
    // The side with the positive delta is the one frustrating its opponent
    // (the stronger low block); the other is the side that can't break it.
    const gainer = a > 0 ? aSlug : bSlug;
    const frustrated = a > 0 ? bSlug : aSlug;
    const mag = Math.abs(a);
    summary =
      `${safeName(gainer)}'s low block (${getStyle(gainer).lowBlock}/5) vs ` +
      `${safeName(frustrated)}'s ability to break it (${getStyle(frustrated).breakdown}/5) — ` +
      `${safeName(frustrated)} −${mag}, ${safeName(gainer)} +${mag} Elo for this matchup.`;
  }

  return { a, b, frustrationOnA, frustrationOnB, active, summary };
}

function safeName(slug: string): string {
  try {
    return getTeam(slug).name;
  } catch {
    return slug;
  }
}

/** Metadata for transparent UI labelling. */
export function tacticalMatchupMeta(): {
  profiledTeams: number;
  weight: number;
  cap: number;
} {
  return {
    profiledTeams: Object.keys(TEAM_STYLES).length,
    weight: TACTICAL_CLASH_WEIGHT,
    cap: TACTICAL_CAP,
  };
}
