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
 * V5.1.2 — FIRST-ROUND STATE (18 June). These two attributes are where a team's
 * "current state" after round 1 is re-scored. Base STRENGTH is re-scored
 * automatically by the result-learning layer (a favourite that only drew loses
 * Elo); here we re-score the MATCHUP SHAPE the result can't see:
 *   • Finishing Reality / Chance Quality → trim `breakdown` (Kill Index) for
 *     favourites who controlled but couldn't finish (Spain 0-0 Cape Verde,
 *     Portugal 1-1 DR Congo, Brazil 1-1 Morocco, Belgium 1-1 Egypt, Uruguay).
 *   • Energy / Youth Tempo → keep/raise `breakdown` for young, high-press sides
 *     (England, Norway, USA, Sweden, Austria) — experience of old foes is not an
 *     infinite credit.
 *   • Verified Resistance → raise `lowBlock` for underdogs who genuinely held a
 *     favourite (DR Congo, Qatar, Cape Verde, Morocco, Egypt, NZ, Saudi…); lower
 *     it for blocks that were breached (Senegal, Iraq, Algeria, Tunisia, Croatia
 *     vs high tempo). Squad condition (red cards / suspensions) is handled in
 *     availabilityAdjustments.ts, not here.
 *
 * Last updated: 2026-06-18 (V5.1.2 first-round state re-score).
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
  // ── Elite / verified low blocks (frustrate possession sides) ─────────────
  "cape-verde": { lowBlock: 5, breakdown: 1, note: "Debutants' disciplined low block + Vozinha held Spain to 0-0 on 27 shots; little going forward." },
  morocco: { lowBlock: 4, breakdown: 2, note: "2022 semi-finalists' organisation; held Brazil 1-1 — resistance verified." },
  "dr-congo": { lowBlock: 4, breakdown: 2, note: "V5.1.2: held Portugal 1-1 — deep block + a real transition outlet; resistance verified." },
  qatar: { lowBlock: 4, breakdown: 2, note: "V5.1.2: held Switzerland 1-1 with a deep block + counter; resistance verified." },
  iran: { lowBlock: 4, breakdown: 2, note: "Classic deep, compact block; dangerous mainly in transition." },
  ghana: { lowBlock: 4, breakdown: 2, note: "V5.1.2: two clean sheets — beat Panama 1-0 and held England 0-0 (19 shots faced); a genuine organised block, blunt going forward. Resistance verified (note: vs an elite breakdown-4 attack the block is matched, not dominant)." },

  // ── Solid, well-organised mid/low blocks ────────────────────────────────
  uruguay: { lowBlock: 3, breakdown: 2, note: "V5.1.2: structure intact but finishing/creation lacked vs Saudi (1-1); kill index trimmed. CB injuries also blunt the block." },
  egypt: { lowBlock: 3, breakdown: 2, note: "Sat deep and frustrated Belgium 1-1; threat on the break — resistance verified." },
  japan: { lowBlock: 3, breakdown: 3, note: "Well-drilled, sharp in transition; traded blows with the Netherlands 2-2." },
  "ivory-coast": { lowBlock: 3, breakdown: 3, note: "Athletic, organised, AFCON-winning structure." },
  switzerland: { lowBlock: 3, breakdown: 2, note: "V5.1.2: tournament-tough block, but finishing/defensive handling exposed in the 1-1 vs Qatar." },
  "saudi-arabia": { lowBlock: 3, breakdown: 2, note: "Deep block + counters; held Uruguay 1-1 — resistance verified." },
  "south-korea": { lowBlock: 3, breakdown: 3, note: "V5.1.2: energetic press + youth tempo; came from behind to beat Czechia 2-1 — late-game threat up." },
  "bosnia-and-herzegovina": { lowBlock: 3, breakdown: 2, note: "Resilient, hard to beat but blunt up front; held Canada 1-1 — resistance verified." },
  panama: { lowBlock: 3, breakdown: 2, note: "Organised, physical, disciplined — made Ghana work for a 1-0; resistance solid, finishing weak." },
  australia: { lowBlock: 3, breakdown: 2, note: "Physical, compact, set-piece reliant; saw off Turkey 2-0." },
  jordan: { lowBlock: 3, breakdown: 2, note: "Deep block, counterattacking; defence pressured by Austria." },
  "new-zealand": { lowBlock: 3, breakdown: 2, note: "Physical, organised; held Iran 2-2 — resistance verified." },
  curacao: { lowBlock: 3, breakdown: 1, note: "V5.1.2: parked the bus for a historic 0-0 vs Ecuador, but the 7-1 opening loss to Germany caps the block below the elite tier; minimal threat (1 goal in 2)." },

  // ── Blocks downgraded after round 1 (breached / overrun) ────────────────
  senegal: { lowBlock: 2, breakdown: 3, note: "V5.1.2: resistance was overrated — could not hold a high-kill France (1-3); block downgraded." },
  algeria: { lowBlock: 2, breakdown: 3, note: "V5.1.2: could not contain Argentina (0-3); low block downgraded." },
  iraq: { lowBlock: 2, breakdown: 2, note: "V5.1.2: back line breached 1-4 by Norway; block downgraded." },
  tunisia: { lowBlock: 2, breakdown: 2, note: "V5.1.2: defence breached 1-5 by Sweden; block downgraded." },
  croatia: { lowBlock: 2, breakdown: 3, note: "V5.1.2: experience intact but overrun by England's tempo (2-4); resistance discounted vs high-energy young sides." },

  // ── Possession sides whose FINISHING was downgraded after round 1 ────────
  spain: { lowBlock: 1, breakdown: 2, note: "V5.1.2: elite possession but 0-0 vs Cape Verde with Yamal not fully fit — block-breaking/finishing trimmed until he is sharp." },
  germany: { lowBlock: 1, breakdown: 3, note: "Dominates the ball; 7-1 vs Curaçao (weak opponent) shows the edge is there, but can still stall vs compact defences." },
  portugal: { lowBlock: 2, breakdown: 2, note: "V5.1.2: 'strikerless' look in the 1-1 vs DR Congo (Ronaldo blank) — penetration/finishing trimmed; win ability intact, big-cover ability not." },
  belgium: { lowBlock: 2, breakdown: 2, note: "V5.1.2: ageing core blunted by Egypt's block (1-1); finishing trimmed." },

  // ── Sides with real, verified block-breaking kill power ──────────────────
  france: { lowBlock: 2, breakdown: 4, note: "Individual quality (Mbappé) unpicks low blocks; 3-1 vs Senegal — kill index verified." },
  brazil: { lowBlock: 2, breakdown: 3, note: "V5.1.2: still dangerous but block-breaking was unreliable in the 1-1 vs Morocco — elite kill index trimmed a notch." },
  argentina: { lowBlock: 2, breakdown: 4, note: "Messi-class creation + set-piece threat; 3-0 vs Algeria — kill index verified." },
  england: { lowBlock: 2, breakdown: 4, note: "V5.1.2: young, high-tempo, multi-threat (Kane/Bellingham/Rashford) — 4-2 vs Croatia; kill index verified." },
  norway: { lowBlock: 2, breakdown: 4, note: "V5.1.2: Haaland/Ødegaard are genuine penalty-box kill power; 4-1 vs Iraq." },
  usa: { lowBlock: 2, breakdown: 3, note: "V5.1.2: real cutting edge in the 4-1 vs Paraguay; host energy." },
  sweden: { lowBlock: 2, breakdown: 3, note: "V5.1.2: ruthless finishing in the 5-1 vs Tunisia." },
  austria: { lowBlock: 2, breakdown: 3, note: "V5.1.2: pressing + execution in the 3-1 vs Jordan." },
  netherlands: { lowBlock: 2, breakdown: 3, note: "Possession-based; defensive control wobbled in the 2-2 vs Japan." },
  canada: { lowBlock: 2, breakdown: 3, note: "Real attacking threat (Davies/David/Larin/Buchanan) — a host side that pushes, not a low block; rated up with Davies fit." },
  colombia: { lowBlock: 2, breakdown: 3, note: "Possession + creativity; quality told late in the 3-1 vs Uzbekistan, though the game stayed alive until then." },
  mexico: { lowBlock: 2, breakdown: 3, note: "Possession-based press, especially at home; not a low-block side." },
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
