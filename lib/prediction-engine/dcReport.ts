/**
 * Loader for the nightly ridge Dixon-Coles backtest report
 * (`betting-backtest/reports/dc_latest.json`, produced by `dc_model.py`).
 *
 * This is the INDEPENDENT cross-check on the TypeScript engine's own
 * walk-forward numbers (see trackRecord.ts): a separately-fit Python
 * bivariate-Poisson model, leave-one-out scored on the same completed
 * fixtures. The two agreeing out-of-sample is the credibility story on
 * the /accuracy page. Fail-soft: returns null if the report is absent
 * (e.g. a fresh clone that hasn't run `npm run dc:backtest`).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface DcReport {
  generated: string;
  nMatches: number;
  nTeams: number;
  ridge: number;
  homeAdvantage: number;
  mu0: number;
  rho: number;
  loo: {
    rps: number;
    brier: number;
    logloss: number;
    rpsSkill: number;
    brierSkill: number;
    topAcc: number;
    decisiveAcc: number;
    ece: number;
  };
}

export function loadDcReport(): DcReport | null {
  try {
    const p = join(process.cwd(), "betting-backtest", "reports", "dc_latest.json");
    const raw = JSON.parse(readFileSync(p, "utf8"));
    if (!raw || typeof raw !== "object" || !raw.loo) return null;
    return {
      generated: String(raw.generated ?? ""),
      nMatches: Number(raw.n_matches ?? 0),
      nTeams: Number(raw.n_teams ?? 0),
      ridge: Number(raw.ridge ?? 0),
      homeAdvantage: Number(raw.home_advantage ?? 0),
      mu0: Number(raw.mu0 ?? 0),
      rho: Number(raw.rho ?? 0),
      loo: {
        rps: Number(raw.loo.rps ?? 0),
        brier: Number(raw.loo.brier ?? 0),
        logloss: Number(raw.loo.logloss ?? 0),
        rpsSkill: Number(raw.loo.rps_skill ?? 0),
        brierSkill: Number(raw.loo.brier_skill ?? 0),
        topAcc: Number(raw.loo.top_acc ?? 0),
        decisiveAcc: Number(raw.loo.decisive_acc ?? 0),
        ece: Number(raw.loo.ece ?? 0),
      },
    };
  } catch {
    return null;
  }
}
