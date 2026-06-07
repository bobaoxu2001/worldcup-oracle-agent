/**
 * Calibrated Elo ratings — the strength inputs to the match model.
 *
 * The CALIBRATED block is taken verbatim from the open-source
 * `Hicruben/world-cup-2026-prediction-model` (data/elo-calibrated.json),
 * produced by walk-forward calibration on 920 real internationals
 * (Oct 2023 – May 2026) via Elo with importance- & recency-weighting.
 *
 * The SUPPLEMENTAL block adds long-run strength priors for the 9 finalists
 * that qualified via play-offs / as debutants and were not in the original
 * calibrated set (Türkiye, Sweden, Norway, Austria, Iraq, Uzbekistan,
 * DR Congo, Cape Verde, Curaçao). Priors are anchored to World Football Elo
 * levels as of mid-2026. Edit these as ratings move.
 */

// From the open-source model (data/elo-calibrated.json), matchesApplied: 920.
const CALIBRATED: Record<string, number> = {
  argentina: 2064,
  france: 2040,
  spain: 2074,
  brazil: 1994,
  england: 1982,
  portugal: 1934,
  netherlands: 1942,
  germany: 1927,
  belgium: 1871,
  italy: 1915,
  colombia: 1884,
  uruguay: 1833,
  croatia: 1878,
  morocco: 1875,
  switzerland: 1807,
  usa: 1794,
  mexico: 1830,
  japan: 1851,
  senegal: 1830,
  denmark: 1790,
  ecuador: 1790,
  australia: 1769,
  "south-korea": 1742,
  iran: 1733,
  poland: 1715,
  canada: 1725,
  serbia: 1695,
  wales: 1665,
  ghana: 1630,
  tunisia: 1666,
  "ivory-coast": 1706,
  nigeria: 1645,
  "saudi-arabia": 1619,
  qatar: 1552,
  egypt: 1671,
  algeria: 1676,
  scotland: 1616,
  cameroon: 1600,
  paraguay: 1653,
  venezuela: 1590,
  chile: 1580,
  peru: 1575,
  "czech-republic": 1613,
  "bosnia-and-herzegovina": 1566,
  "south-africa": 1562,
  "new-zealand": 1567,
  panama: 1582,
  jamaica: 1460,
  honduras: 1440,
  jordan: 1515,
  haiti: 1481,
  "el-salvador": 1370,
  "trinidad-and-tobago": 1360,
  guatemala: 1345,
};

// Long-run strength priors for finalists missing from the calibrated set.
const SUPPLEMENTAL: Record<string, number> = {
  norway: 1812, // strong qualifying campaign (Haaland/Ødegaard era)
  austria: 1788,
  turkey: 1782,
  sweden: 1734,
  "dr-congo": 1688,
  uzbekistan: 1632,
  "cape-verde": 1604,
  iraq: 1598,
  curacao: 1512,
};

export const ELO_RATINGS: Record<string, number> = {
  ...CALIBRATED,
  ...SUPPLEMENTAL,
};

/** Home-field Elo bonus applied to the three host nations (USA/MEX/CAN). */
export const HOME_ADVANTAGE = 75;

const DEFAULT_RATING = 1500;

export function getRating(slug: string): number {
  return ELO_RATINGS[slug] ?? DEFAULT_RATING;
}
