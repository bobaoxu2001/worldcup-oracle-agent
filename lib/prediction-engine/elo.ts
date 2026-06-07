/**
 * Elo + Dixon-Coles bivariate Poisson — the match model.
 *
 * Ported verbatim (logic preserved) from the open-source
 * `Hicruben/world-cup-2026-prediction-model` (elo.mjs).
 * References: World Football Elo; Maher (1982); Dixon & Coles (1997).
 */

export const K_FACTOR_WC = 60;

// Dixon-Coles ρ — corrects vanilla Poisson's under-count of 0-0 / 1-1 draws.
export const DC_RHO = -0.13;

function dcTau(
  a: number,
  b: number,
  lambda: number,
  mu: number,
  rho: number
): number {
  if (a === 0 && b === 0) return 1 - lambda * mu * rho;
  if (a === 0 && b === 1) return 1 + lambda * rho;
  if (a === 1 && b === 0) return 1 + mu * rho;
  if (a === 1 && b === 1) return 1 - rho;
  return 1;
}

/** Elo win expectancy (logistic on rating difference). */
export function expectedScore(
  ratingA: number,
  ratingB: number,
  homeBonusA = 0
): number {
  return 1 / (1 + Math.pow(10, (ratingB - (ratingA + homeBonusA)) / 400));
}

/**
 * Rating difference → expected goals (Poisson λ). Flat denominator keeps
 * single-match variance near real football upset frequency.
 */
export function expectedGoals(
  rating: number,
  opponent: number,
  homeBonus = 0
): number {
  const diff = rating + homeBonus - opponent;
  const lambda = 1.35 + diff / 350;
  return Math.max(0.3, Math.min(3.5, lambda));
}

export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

export function poissonSample(lambda: number, rng: () => number = Math.random): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export interface MatchProb {
  winA: number;
  draw: number;
  winB: number;
  expectedGoalsA: number;
  expectedGoalsB: number;
}

/** 1X2 probabilities via Dixon-Coles bivariate Poisson over 0–8 goals each side. */
export function matchProb(
  ratingA: number,
  ratingB: number,
  homeBonusA = 0
): MatchProb {
  const lambda = expectedGoals(ratingA, ratingB, homeBonusA);
  const mu = expectedGoals(ratingB, ratingA, -homeBonusA / 2);
  let winA = 0;
  let draw = 0;
  let winB = 0;
  for (let a = 0; a <= 8; a++) {
    const pA = poissonPmf(a, lambda);
    for (let b = 0; b <= 8; b++) {
      const tau = dcTau(a, b, lambda, mu, DC_RHO);
      const p = pA * poissonPmf(b, mu) * tau;
      if (a > b) winA += p;
      else if (a < b) winB += p;
      else draw += p;
    }
  }
  const total = winA + draw + winB;
  return {
    winA: winA / total,
    draw: draw / total,
    winB: winB / total,
    expectedGoalsA: lambda,
    expectedGoalsB: mu,
  };
}

/**
 * Full 9×9 scoreline probability grid (Dixon-Coles corrected, normalised).
 * Used to surface the single most-likely scoreline.
 */
export function scorelineGrid(
  ratingA: number,
  ratingB: number,
  homeBonusA = 0
): { a: number; b: number; p: number }[] {
  const lambda = expectedGoals(ratingA, ratingB, homeBonusA);
  const mu = expectedGoals(ratingB, ratingA, -homeBonusA / 2);
  const grid: { a: number; b: number; p: number }[] = [];
  let total = 0;
  for (let a = 0; a <= 8; a++) {
    for (let b = 0; b <= 8; b++) {
      const p =
        poissonPmf(a, lambda) * poissonPmf(b, mu) * dcTau(a, b, lambda, mu, DC_RHO);
      grid.push({ a, b, p });
      total += p;
    }
  }
  return grid.map((g) => ({ ...g, p: g.p / total }));
}

/**
 * Sample a scoreline (for Monte Carlo). allowDraw=false → penalty-shootout
 * nudge toward the higher-Elo side.
 */
export function sampleMatch(
  ratingA: number,
  ratingB: number,
  homeBonusA = 0,
  allowDraw = true,
  rng: () => number = Math.random
): { goalsA: number; goalsB: number } {
  const eA = expectedGoals(ratingA, ratingB, homeBonusA);
  const eB = expectedGoals(ratingB, ratingA, -homeBonusA / 2);
  let goalsA = poissonSample(eA, rng);
  let goalsB = poissonSample(eB, rng);
  if (!allowDraw && goalsA === goalsB) {
    if (rng() < expectedScore(ratingA, ratingB, homeBonusA)) goalsA += 1;
    else goalsB += 1;
  }
  return { goalsA, goalsB };
}

/**
 * Mulberry32 — tiny, fast, seedable PRNG. Used so the Monte Carlo tournament
 * simulation is reproducible across server requests (stable championship odds).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
