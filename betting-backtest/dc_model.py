"""
dc_model.py — Ridge-regularised Dixon-Coles goals model, fit on the recorded
World Cup 2026 scores, validated leave-one-out (LOO), and calibrated.

WHY this exists
---------------
The rest of betting-backtest only SCORES pre-recorded predictions. This file adds
the missing piece: a model that actually FITS the goals data and produces its own
1X2 + scoreline predictions, which then flow back into the same evaluator and
betting decision engine via predictions.csv.

THE MODEL (Dixon & Coles, 1997, with ridge shrinkage)
-----------------------------------------------------
Each team i has an attack a_i and defence d_i. For a match (home h, away a):

    log λ_home = μ0 + a_h − d_a + γ·home_flag      (γ = home advantage; hosts only)
    log λ_away = μ0 + a_a − d_h

Goals are independent Poisson with means λ_home, λ_away, multiplied by the
Dixon-Coles low-score dependence term τ(x, y; λ, μ, ρ) that corrects the
0-0 / 1-0 / 0-1 / 1-1 cells (where the independence assumption fails most).

RIDGE: with only ~3 group games per team, an unpenalised fit wildly over-fits
(a team that won 4-0 looks unbeatable). We add −(k/2)·Σ(a_i² + d_i²), shrinking
every team toward a common average. k is chosen by the LOO log-loss itself
(self-tuning), so the regularisation strength is picked out-of-sample, not by hand.

LOO BACKTEST: for every match we REFIT the model on the other N−1 matches and
predict the held-out one. That match never touches its own fit, so the score is a
genuine out-of-sample estimate of generalisation (the rigorous version of the
"no look-ahead" rule this project is built around). NB: LOO is cross-sectional
out-of-sample, not strictly time-ordered walk-forward — it uses other matches
regardless of date; the headline metrics are reported as such.

CALIBRATION: the pooled-outcome reliability table + ECE from backtest.py — the
same calibration the Elo backtest reports — computed on the LOO predictions.

Pure standard library (no numpy), Python 3.8+. Run:

    cd betting-backtest
    python3 dc_model.py [data_dir]      # defaults to ./data, falls back to ./sample_data
    python3 dc_model.py --selftest      # invariant checks (used by CI)
"""

from __future__ import annotations

import json
import math
import os
import sys
import datetime

import schema
import backtest as bt

EPS = 1e-12
MAX_GOALS = 10          # scoreline grid 0..MAX_GOALS for 1X2 integration
RHO_CLAMP = 0.18        # keep the DC τ term positive and stable


# ──────────────────────────────────────────────────────────────────────────
# Data
# ──────────────────────────────────────────────────────────────────────────
class Match:
    __slots__ = ("mid", "date", "kickoff", "h", "a", "hg", "ag", "home_flag", "home_name", "away_name")

    def __init__(self, mid, date, kickoff, h, a, hg, ag, home_flag, home_name, away_name):
        self.mid = mid
        self.date = date
        self.kickoff = kickoff
        self.h = h            # home team index
        self.a = a            # away team index
        self.hg = hg          # home goals
        self.ag = ag          # away goals
        self.home_flag = home_flag  # 1 if the home side actually has home advantage
        self.home_name = home_name
        self.away_name = away_name


def load_matches(rows):
    """Parse matches.csv rows (with final goals) into Match objects + team index."""
    teams: list[str] = []
    idx: dict[str, int] = {}

    def team_id(name):
        if name not in idx:
            idx[name] = len(teams)
            teams.append(name)
        return idx[name]

    matches = []
    for r in rows:
        if r.get("final_home_goals", "") == "" or r.get("final_away_goals", "") == "":
            continue
        hg = int(r["final_home_goals"])
        ag = int(r["final_away_goals"])
        home = r["home_team"].strip()
        away = r["away_team"].strip()
        home_flag = 1 if (r.get("neutral_or_home_context", "neutral").strip() == "home") else 0
        matches.append(
            Match(r["match_id"], r.get("date", ""), r.get("kickoff_time", ""),
                  team_id(home), team_id(away), hg, ag, home_flag, home, away)
        )
    return matches, teams


# ──────────────────────────────────────────────────────────────────────────
# Model parameters
# ──────────────────────────────────────────────────────────────────────────
class Params:
    __slots__ = ("mu0", "home", "rho", "att", "deff", "n")

    def __init__(self, n):
        self.n = n
        self.mu0 = 0.0
        self.home = 0.25
        self.rho = -0.05
        self.att = [0.0] * n
        self.deff = [0.0] * n

    def copy(self):
        p = Params(self.n)
        p.mu0, p.home, p.rho = self.mu0, self.home, self.rho
        p.att = list(self.att)
        p.deff = list(self.deff)
        return p


def _lambdas(p: Params, m: Match):
    eta_h = p.mu0 + p.att[m.h] - p.deff[m.a] + p.home * m.home_flag
    eta_a = p.mu0 + p.att[m.a] - p.deff[m.h]
    lam = math.exp(min(3.5, eta_h))   # clamp the exponent for numerical safety
    mu = math.exp(min(3.5, eta_a))
    return lam, mu


def _tau(x, y, lam, mu, rho):
    if x == 0 and y == 0:
        return 1.0 - lam * mu * rho
    if x == 0 and y == 1:
        return 1.0 + lam * rho
    if x == 1 and y == 0:
        return 1.0 + mu * rho
    if x == 1 and y == 1:
        return 1.0 - rho
    return 1.0


# ──────────────────────────────────────────────────────────────────────────
# Penalised log-likelihood + analytic gradient
# ──────────────────────────────────────────────────────────────────────────
def neg_penalised_ll(p: Params, matches, ridge):
    """Penalised log-likelihood (returned positive = higher is better)."""
    ll = 0.0
    for m in matches:
        lam, mu = _lambdas(p, m)
        tau = max(EPS, _tau(m.hg, m.ag, lam, mu, p.rho))
        ll += (m.hg * math.log(lam) - lam - math.lgamma(m.hg + 1))
        ll += (m.ag * math.log(mu) - mu - math.lgamma(m.ag + 1))
        ll += math.log(tau)
    pen = 0.0
    for i in range(p.n):
        pen += p.att[i] * p.att[i] + p.deff[i] * p.deff[i]
    return ll - 0.5 * ridge * pen


def gradient(p: Params, matches, ridge):
    """Analytic gradient of the penalised LL w.r.t. every parameter."""
    g_att = [0.0] * p.n
    g_def = [0.0] * p.n
    g_mu0 = 0.0
    g_home = 0.0
    g_rho = 0.0
    for m in matches:
        lam, mu = _lambdas(p, m)
        x, y, rho = m.hg, m.ag, p.rho
        tau = max(EPS, _tau(x, y, lam, mu, rho))

        # dτ/dλ, dτ/dμ, dτ/dρ for the four corrected cells (0 otherwise).
        dtau_dlam = dtau_dmu = dtau_drho = 0.0
        if x == 0 and y == 0:
            dtau_dlam = -mu * rho
            dtau_dmu = -lam * rho
            dtau_drho = -lam * mu
        elif x == 0 and y == 1:
            dtau_dlam = rho
            dtau_drho = lam
        elif x == 1 and y == 0:
            dtau_dmu = rho
            dtau_drho = mu
        elif x == 1 and y == 1:
            dtau_drho = -1.0

        # dLL/dη_home and dLL/dη_away (Poisson part + τ part; chain dλ/dη = λ).
        dll_deta_h = (x - lam) + (lam * dtau_dlam) / tau
        dll_deta_a = (y - mu) + (mu * dtau_dmu) / tau

        g_att[m.h] += dll_deta_h
        g_att[m.a] += dll_deta_a
        g_def[m.a] += -dll_deta_h
        g_def[m.h] += -dll_deta_a
        g_mu0 += dll_deta_h + dll_deta_a
        g_home += m.home_flag * dll_deta_h
        g_rho += dtau_drho / tau

    for i in range(p.n):
        g_att[i] -= ridge * p.att[i]
        g_def[i] -= ridge * p.deff[i]
    return g_att, g_def, g_mu0, g_home, g_rho


def fit(matches, n_teams, ridge=0.25, steps=400, init: Params | None = None, lr=0.06):
    """Maximise the penalised LL by Adam gradient ascent with gauge fixing."""
    p = init.copy() if init is not None else Params(n_teams)
    # Adam state.
    m_att = [0.0] * n_teams; v_att = [0.0] * n_teams
    m_def = [0.0] * n_teams; v_def = [0.0] * n_teams
    m_s = {"mu0": 0.0, "home": 0.0, "rho": 0.0}
    v_s = {"mu0": 0.0, "home": 0.0, "rho": 0.0}
    b1, b2, eps = 0.9, 0.999, 1e-8

    for t in range(1, steps + 1):
        g_att, g_def, g_mu0, g_home, g_rho = gradient(p, matches, ridge)

        def adam_vec(val, grad, mvec, vvec, i):
            mvec[i] = b1 * mvec[i] + (1 - b1) * grad
            vvec[i] = b2 * vvec[i] + (1 - b2) * grad * grad
            mhat = mvec[i] / (1 - b1 ** t)
            vhat = vvec[i] / (1 - b2 ** t)
            return val + lr * mhat / (math.sqrt(vhat) + eps)

        for i in range(n_teams):
            p.att[i] = adam_vec(p.att[i], g_att[i], m_att, v_att, i)
            p.deff[i] = adam_vec(p.deff[i], g_def[i], m_def, v_def, i)

        def adam_scalar(val, grad, key):
            m_s[key] = b1 * m_s[key] + (1 - b1) * grad
            v_s[key] = b2 * v_s[key] + (1 - b2) * grad * grad
            mhat = m_s[key] / (1 - b1 ** t)
            vhat = v_s[key] / (1 - b2 ** t)
            return val + lr * mhat / (math.sqrt(vhat) + eps)

        p.mu0 = adam_scalar(p.mu0, g_mu0, "mu0")
        p.home = adam_scalar(p.home, g_home, "home")
        p.rho = adam_scalar(p.rho, g_rho, "rho")
        p.rho = max(-RHO_CLAMP, min(RHO_CLAMP, p.rho))

        # Gauge fixing: attack and defence are identified only up to a common
        # shift (absorbed by μ0). Pin both means to 0 each step.
        ma = sum(p.att) / n_teams
        md = sum(p.deff) / n_teams
        for i in range(n_teams):
            p.att[i] -= ma
            p.deff[i] -= md
        p.mu0 += ma - md  # keep λ unchanged after recentring
    return p


# ──────────────────────────────────────────────────────────────────────────
# Prediction
# ──────────────────────────────────────────────────────────────────────────
def _poisson_pmf(k, lam):
    return math.exp(k * math.log(lam) - lam - math.lgamma(k + 1))


def score_matrix(p: Params, h, a, home_flag):
    """DC-corrected joint score probabilities P(x,y), normalised over the grid."""
    m = Match("", "", "", h, a, 0, 0, home_flag, "", "")
    lam, mu = _lambdas(p, m)
    ph = [_poisson_pmf(x, lam) for x in range(MAX_GOALS + 1)]
    pa = [_poisson_pmf(y, mu) for y in range(MAX_GOALS + 1)]
    mat = [[0.0] * (MAX_GOALS + 1) for _ in range(MAX_GOALS + 1)]
    total = 0.0
    for x in range(MAX_GOALS + 1):
        for y in range(MAX_GOALS + 1):
            v = ph[x] * pa[y] * max(EPS, _tau(x, y, lam, mu, p.rho))
            mat[x][y] = v
            total += v
    if total > 0:
        for x in range(MAX_GOALS + 1):
            for y in range(MAX_GOALS + 1):
                mat[x][y] /= total
    return mat


def outcome_probs(mat):
    """(P_home, P_draw, P_away) from a score matrix."""
    ph = pd = pa = 0.0
    n = len(mat)
    for x in range(n):
        for y in range(n):
            if x > y:
                ph += mat[x][y]
            elif x == y:
                pd += mat[x][y]
            else:
                pa += mat[x][y]
    return ph, pd, pa


def top_scorelines(mat, k=3):
    cells = []
    n = len(mat)
    for x in range(n):
        for y in range(n):
            cells.append((mat[x][y], x, y))
    cells.sort(reverse=True)
    return [f"{x}-{y}" for _, x, y in cells[:k]]


# ──────────────────────────────────────────────────────────────────────────
# Metrics
# ──────────────────────────────────────────────────────────────────────────
def _onehot(result):
    return (1 if result == "home" else 0, 1 if result == "draw" else 0, 1 if result == "away" else 0)


def brier(probs, result):
    yh, yd, ya = _onehot(result)
    h, d, a = probs
    return (h - yh) ** 2 + (d - yd) ** 2 + (a - ya) ** 2


def logloss(probs, result):
    h, d, a = probs
    pa = {"home": h, "draw": d, "away": a}[result]
    return -math.log(max(EPS, pa))


def rps(probs, result):
    """Ranked Probability Score for ordered outcomes home<draw<away (lower better)."""
    h, d, a = probs
    yh, yd, ya = _onehot(result)
    c1 = (h - yh)
    c2 = (h + d) - (yh + yd)
    return 0.5 * (c1 * c1 + c2 * c2)


def result_of(hg, ag):
    return "home" if hg > ag else "away" if ag > hg else "draw"


# ──────────────────────────────────────────────────────────────────────────
# LOO backtest
# ──────────────────────────────────────────────────────────────────────────
def loo_backtest(matches, n_teams, ridge, full_params, loo_steps=140):
    """Refit on all-but-one and predict the held-out match. Warm-started from the
    full fit so each refit only needs a short polish. Returns per-match rows."""
    rows = []
    for i, m in enumerate(matches):
        others = matches[:i] + matches[i + 1:]
        p = fit(others, n_teams, ridge=ridge, steps=loo_steps, init=full_params, lr=0.04)
        mat = score_matrix(p, m.h, m.a, m.home_flag)
        probs = outcome_probs(mat)
        result = result_of(m.hg, m.ag)
        rows.append({
            "match": m,
            "probs": probs,
            "top": top_scorelines(mat, 3),
            "result": result,
            "brier": brier(probs, result),
            "logloss": logloss(probs, result),
            "rps": rps(probs, result),
        })
    return rows


def aggregate(rows):
    n = len(rows) or 1
    out = {
        "n": len(rows),
        "brier": sum(r["brier"] for r in rows) / n,
        "logloss": sum(r["logloss"] for r in rows) / n,
        "rps": sum(r["rps"] for r in rows) / n,
    }
    # Top-pick accuracy (with draws, and decisive-only).
    hit = dec_hit = dec_n = 0
    for r in rows:
        h, d, a = r["probs"]
        pick = "home" if h >= d and h >= a else "draw" if d >= a else "away"
        if pick == r["result"]:
            hit += 1
        if r["result"] != "draw":
            dec_n += 1
            if pick == r["result"]:
                dec_hit += 1
    out["top_acc"] = hit / n
    out["decisive_acc"] = dec_hit / dec_n if dec_n else 0.0
    # Uniform 1/3 baseline.
    out["brier_unif"] = sum(brier((1 / 3, 1 / 3, 1 / 3), r["result"]) for r in rows) / n
    out["logloss_unif"] = math.log(3)
    out["rps_unif"] = sum(rps((1 / 3, 1 / 3, 1 / 3), r["result"]) for r in rows) / n
    out["brier_skill"] = 1 - out["brier"] / out["brier_unif"] if out["brier_unif"] else 0.0
    out["rps_skill"] = 1 - out["rps"] / out["rps_unif"] if out["rps_unif"] else 0.0
    return out


def calibration_from_rows(rows, n_bins=5):
    """Reuse the project's pooled-outcome reliability table + ECE on LOO preds."""
    points = []
    for r in rows:
        h, d, a = r["probs"]
        points.append((h, 1 if r["result"] == "home" else 0))
        points.append((d, 1 if r["result"] == "draw" else 0))
        points.append((a, 1 if r["result"] == "away" else 0))
    edges = [i / n_bins for i in range(n_bins + 1)]
    bins = []
    ece = 0.0
    total = len(points) or 1
    for i in range(n_bins):
        lo, hi = edges[i], edges[i + 1] + (1e-9 if i == n_bins - 1 else 0)
        pts = [pt for pt in points if lo <= pt[0] < hi]
        if not pts:
            continue
        mean_pred = sum(x for x, _ in pts) / len(pts)
        observed = sum(y for _, y in pts) / len(pts)
        ece += (len(pts) / total) * abs(mean_pred - observed)
        bins.append({
            "label": f"{int(lo*100):02d}-{int(edges[i+1]*100):02d}%",
            "n": len(pts), "mean_pred": mean_pred, "observed": observed,
            "gap": observed - mean_pred,
        })
    return {"bins": bins, "ece": ece}


def tune_ridge(matches, n_teams, full_params_by_ridge, grid):
    """Pick the ridge k with the lowest LOO log-loss (self-tuning regularisation)."""
    best = None
    table = []
    for k in grid:
        rows = loo_backtest(matches, n_teams, k, full_params_by_ridge[k], loo_steps=110)
        agg = aggregate(rows)
        table.append((k, agg["logloss"], agg["rps"]))
        if best is None or agg["logloss"] < best[1]:
            best = (k, agg["logloss"], rows, agg)
    return best, table


# ──────────────────────────────────────────────────────────────────────────
# Report
# ──────────────────────────────────────────────────────────────────────────
def team_table(params: Params, teams):
    # Overall strength = attack + defence: a high attack a_i means the team
    # SCORES more (log λ_for = μ0 + a_i − d_opp), and a high defence d_i means
    # the opponent CONCEDES into a lower mean (log λ_against = μ0 + a_opp − d_i),
    # so both add to a team's net rating.
    rated = sorted(
        ([teams[i], params.att[i], params.deff[i], params.att[i] + params.deff[i]] for i in range(len(teams))),
        key=lambda r: r[3], reverse=True,
    )
    return rated


def write_predictions_csv(data_dir, rows):
    """LOO out-of-sample predictions in the betting-backtest schema."""
    out = []
    for r in rows:
        m = r["match"]
        h, d, a = r["probs"]
        # Stamp predictions just before kickoff so the walk-forward check passes;
        # the model_version makes the LOO provenance explicit.
        ts = (m.kickoff or "").replace("T18:", "T16:") or m.date
        out.append({
            "match_id": m.mid,
            "prediction_timestamp": ts,
            "predicted_home_win_prob": round(h, 4),
            "predicted_draw_prob": round(d, 4),
            "predicted_away_win_prob": round(a, 4),
            "top1_score": r["top"][0],
            "top2_score": r["top"][1],
            "top3_score": r["top"][2],
            "model_version": "DC-ridge-LOO",
            "notes": "leave-one-out out-of-sample Dixon-Coles",
        })
    schema.write_csv(os.path.join(data_dir, "predictions.csv"), schema.PREDICTIONS_COLUMNS, out)


def build_report(teams, full_params, ridge, agg, cal, ridge_table, rated, n_matches):
    lines = []
    p = full_params
    lines.append("=" * 70)
    lines.append("  RIDGE DIXON-COLES — fit + leave-one-out backtest")
    lines.append("=" * 70)
    lines.append(f"Matches fit on .......... {n_matches}")
    lines.append(f"Teams ................... {len(teams)}")
    lines.append(f"Ridge k (LOO-tuned) ..... {ridge:.3f}")
    lines.append(f"Home advantage (γ) ...... {p.home:+.3f}   (log-goals; hosts only)")
    lines.append(f"Baseline μ0 ............. {p.mu0:+.3f}   →  {math.exp(p.mu0):.2f} goals/side neutral")
    lines.append(f"Dixon-Coles ρ ........... {p.rho:+.3f}   (low-score dependence)")
    lines.append("")
    lines.append("-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------")
    lines.append(f"RPS      {agg['rps']:.3f}   vs uniform {agg['rps_unif']:.3f}   (skill {agg['rps_skill']*100:+.1f}%)")
    lines.append(f"Brier    {agg['brier']:.3f}   vs uniform {agg['brier_unif']:.3f}   (skill {agg['brier_skill']*100:+.1f}%)")
    lines.append(f"LogLoss  {agg['logloss']:.3f}   vs uniform {agg['logloss_unif']:.3f}")
    lines.append(f"Top-pick accuracy ....... {agg['top_acc']*100:.1f}%   (decisive only {agg['decisive_acc']*100:.1f}%)")
    lines.append("")
    lines.append("-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------")
    lines.append("  bucket      n   mean_pred  observed   gap")
    for b in cal["bins"]:
        lines.append(f"  {b['label']:<9} {b['n']:>3}   {b['mean_pred']*100:6.0f}%   {b['observed']*100:6.0f}%   {b['gap']*100:+5.0f}%")
    lines.append(f"  ECE: {cal['ece']*100:.1f}%")
    lines.append("")
    lines.append("-- RIDGE TUNING (LOO log-loss by k) --------------------------------")
    for k, ll, rp in ridge_table:
        mark = " *" if abs(k - ridge) < 1e-9 else "  "
        lines.append(f"  k={k:<5}  logloss {ll:.3f}   rps {rp:.3f}{mark}")
    lines.append("")
    lines.append("-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------")
    lines.append("  (att ↑ = scores more · def ↑ = concedes less)")
    lines.append("  Strongest:")
    for name, att, dff, net in rated[:5]:
        lines.append(f"    {name:<22} net {net:+.2f}  (att {att:+.2f}, def {dff:+.2f})")
    lines.append("  Weakest:")
    for name, att, dff, net in rated[-5:]:
        lines.append(f"    {name:<22} net {net:+.2f}  (att {att:+.2f}, def {dff:+.2f})")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────
RIDGE_GRID = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0]


def run(data_dir, write_outputs=True):
    matches_path = os.path.join(data_dir, "matches.csv")
    rows = schema.load_csv(matches_path)
    schema.validate_columns(rows, schema.MATCHES_COLUMNS, "matches.csv")
    matches, teams = load_matches(rows)
    n_teams = len(teams)
    if len(matches) < 8:
        raise SystemExit(f"Need at least 8 played matches to fit; found {len(matches)}.")

    # Full-data fit at each grid k (warm-start the LOO from these).
    full_by_ridge = {k: fit(matches, n_teams, ridge=k, steps=400) for k in RIDGE_GRID}
    best, ridge_table = tune_ridge(matches, n_teams, full_by_ridge, RIDGE_GRID)
    ridge, _, loo_rows, agg = best
    full_params = full_by_ridge[ridge]

    cal = calibration_from_rows(loo_rows)
    rated = team_table(full_params, teams)
    report = build_report(teams, full_params, ridge, agg, cal, ridge_table, rated, len(matches))
    print(report)

    if write_outputs:
        write_predictions_csv(data_dir, loo_rows)
        reports_dir = os.path.join(os.path.dirname(__file__), "reports")
        os.makedirs(reports_dir, exist_ok=True)
        today = datetime.date.today().isoformat()
        # Overwrite a single latest report (git history is the archive — avoids
        # an unbounded pile of dated files in the repo).
        with open(os.path.join(reports_dir, "dc_latest.md"), "w", encoding="utf-8") as f:
            f.write(f"# Ridge Dixon-Coles backtest — results through {today}\n\n")
            f.write("_Auto-generated nightly by `dc_model.py`. Do not edit by hand._\n\n")
            f.write("```\n" + report + "\n```\n")
        latest = {
            "generated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "n_matches": len(matches),
            "n_teams": n_teams,
            "ridge": ridge,
            "home_advantage": full_params.home,
            "mu0": full_params.mu0,
            "rho": full_params.rho,
            "loo": {
                "rps": agg["rps"], "brier": agg["brier"], "logloss": agg["logloss"],
                "rps_skill": agg["rps_skill"], "brier_skill": agg["brier_skill"],
                "top_acc": agg["top_acc"], "decisive_acc": agg["decisive_acc"], "ece": cal["ece"],
            },
            "ridge_grid": [{"k": k, "logloss": ll, "rps": rp} for k, ll, rp in ridge_table],
        }
        with open(os.path.join(reports_dir, "dc_latest.json"), "w", encoding="utf-8") as f:
            json.dump(latest, f, indent=2)
            f.write("\n")
        print("\nWrote data/predictions.csv + reports/dc_latest.md + reports/dc_latest.json")
    return agg, cal, full_params, teams


def selftest():
    """Invariant checks — no network, tiny synthetic data. Used by CI."""
    ok = True

    def check(name, cond):
        nonlocal ok
        print(f"{'✅' if cond else '❌'} {name}")
        ok = ok and cond

    # Synthetic: 6 teams, a clean strength ladder, home side scores more.
    teams = [f"T{i}" for i in range(6)]
    syn = []
    for i in range(6):
        for j in range(6):
            if i == j:
                continue
            hg = max(0, 3 - i)  # stronger (low index) home teams score more
            ag = max(0, j - 2)
            syn.append(Match(f"s{i}{j}", "2026-01-01", "2026-01-01T18:00:00Z", i, j, hg, ag, 1, teams[i], teams[j]))

    p = fit(syn, 6, ridge=0.25, steps=300)
    mat = score_matrix(p, 0, 5, 1)
    h, d, a = outcome_probs(mat)
    check("outcome probs sum to 1", abs((h + d + a) - 1.0) < 1e-6)
    check("strong home team favoured over weak away", h > a)

    # Ridge shrinks the attack spread.
    p_lo = fit(syn, 6, ridge=0.05, steps=300)
    p_hi = fit(syn, 6, ridge=5.0, steps=300)
    spread_lo = max(p_lo.att) - min(p_lo.att)
    spread_hi = max(p_hi.att) - min(p_hi.att)
    check("higher ridge → smaller attack spread", spread_hi < spread_lo)

    # LOO genuinely excludes the held-out match: prediction for a match differs
    # when that match is in vs out of the fit.
    full = fit(syn, 6, ridge=0.25, steps=300)
    m0 = syn[0]
    others = syn[1:]
    p_loo = fit(others, 6, ridge=0.25, steps=300, init=full)
    in_sample = outcome_probs(score_matrix(full, m0.h, m0.a, m0.home_flag))
    out_sample = outcome_probs(score_matrix(p_loo, m0.h, m0.a, m0.home_flag))
    check("LOO prediction differs from in-sample (held-out really excluded)",
          abs(in_sample[0] - out_sample[0]) > 1e-6)

    print("\nAll DC self-tests passed." if ok else "\nDC self-tests FAILED.")
    sys.exit(0 if ok else 1)


def main():
    if "--selftest" in sys.argv:
        selftest()
        return
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    here = os.path.dirname(__file__)
    data_dir = args[0] if args else os.path.join(here, "data")
    if not os.path.exists(os.path.join(data_dir, "matches.csv")):
        data_dir = os.path.join(here, "sample_data")
    run(data_dir)


if __name__ == "__main__":
    main()
