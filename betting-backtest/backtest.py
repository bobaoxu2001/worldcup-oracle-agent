"""
Backtest / evaluation functions — walk-forward by construction.

Every function here SCORES pre-recorded predictions against final results. Nothing
fits or tunes on the results, so there is no look-ahead: the predictions are the
model's pre-match output (timestamped before kickoff; see schema.warn_if_not_walk_forward).

Accuracy functions return floats in [0,1]; the profit simulators return a dict.
All take the loaded list-of-dict rows from schema.load_csv.
"""

from __future__ import annotations

import math

from schema import as_float, parse_score
from decision_engine import implied_prob

EPS = 1e-12


# ── helpers ──────────────────────────────────────────────────────────────────
def _by_id(rows):
    return {r["match_id"]: r for r in rows}


def actual_1x2(match):
    h, a = int(match["final_home_goals"]), int(match["final_away_goals"])
    return "home" if h > a else "away" if a > h else "draw"


def actual_score(match):
    return f"{int(match['final_home_goals'])}-{int(match['final_away_goals'])}"


def model_probs(pred):
    return (
        as_float(pred["predicted_home_win_prob"], 0.0),
        as_float(pred["predicted_draw_prob"], 0.0),
        as_float(pred["predicted_away_win_prob"], 0.0),
    )


def predicted_top_1x2(pred):
    h, d, a = model_probs(pred)
    # argmax with home > draw > away tie-break (deterministic).
    return "home" if h >= d and h >= a else "draw" if d >= a else "away"


def _pairs(predictions, matches):
    """Yield (pred, match) for every prediction that has a match with a result."""
    m = _by_id(matches)
    for p in predictions:
        match = m.get(p["match_id"])
        if match and match["final_home_goals"] != "" and match["final_away_goals"] != "":
            yield p, match


# ── 1) accuracy metrics ──────────────────────────────────────────────────────
def evaluate_1x2_accuracy(predictions, matches):
    n = hit = 0
    for p, match in _pairs(predictions, matches):
        n += 1
        if predicted_top_1x2(p) == actual_1x2(match):
            hit += 1
    return hit / n if n else 0.0


def evaluate_decisive_game_accuracy(predictions, matches):
    """1X2 accuracy on games that had a winner (draws excluded) — the fair
    'did it pick the right side' number, since a 1X2 model rarely makes the draw
    its modal outcome."""
    n = hit = 0
    for p, match in _pairs(predictions, matches):
        if actual_1x2(match) == "draw":
            continue
        n += 1
        if predicted_top_1x2(p) == actual_1x2(match):
            hit += 1
    return hit / n if n else 0.0


def evaluate_top1_score_accuracy(predictions, matches):
    n = hit = 0
    for p, match in _pairs(predictions, matches):
        n += 1
        if p["top1_score"].strip() == actual_score(match):
            hit += 1
    return hit / n if n else 0.0


def evaluate_top3_score_accuracy(predictions, matches):
    n = hit = 0
    for p, match in _pairs(predictions, matches):
        n += 1
        top3 = {p["top1_score"].strip(), p["top2_score"].strip(), p["top3_score"].strip()}
        if actual_score(match) in top3:
            hit += 1
    return hit / n if n else 0.0


# ── 2) probabilistic scoring ─────────────────────────────────────────────────
def calculate_brier_score(predictions, matches):
    """Mean multiclass Brier score over (home, draw, away). Lower is better; 0=perfect."""
    total = n = 0
    for p, match in _pairs(predictions, matches):
        h, d, a = model_probs(p)
        act = actual_1x2(match)
        y = (1 if act == "home" else 0, 1 if act == "draw" else 0, 1 if act == "away" else 0)
        total += (h - y[0]) ** 2 + (d - y[1]) ** 2 + (a - y[2]) ** 2
        n += 1
    return total / n if n else 0.0


def calculate_log_loss(predictions, matches):
    """Mean negative log-likelihood of the actual outcome. Lower is better."""
    total = n = 0
    for p, match in _pairs(predictions, matches):
        h, d, a = model_probs(p)
        act = actual_1x2(match)
        pa = {"home": h, "draw": d, "away": a}[act]
        total += -math.log(max(EPS, pa))
        n += 1
    return total / n if n else 0.0


def calculate_calibration_bins(predictions, matches, n_bins=5):
    """Pool every outcome probability with whether it occurred, then bin.
    Returns a list of {label, n, mean_pred, observed, gap} plus an 'ece' summary."""
    points = []  # (pred_prob, did_it_happen)
    for p, match in _pairs(predictions, matches):
        h, d, a = model_probs(p)
        act = actual_1x2(match)
        points.append((h, 1 if act == "home" else 0))
        points.append((d, 1 if act == "draw" else 0))
        points.append((a, 1 if act == "away" else 0))
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


# ── 3) profit simulators (walk-forward; flat unit to isolate the effect) ─────
def simulate_flat_stake_profit(predictions, matches, prices):
    """Bet a flat 1 unit on the model's top 1X2 pick at the offered price."""
    pr = _by_id(prices)
    staked = pnl = wins = n = 0
    for p, match in _pairs(predictions, matches):
        q = pr.get(p["match_id"])
        if not q:
            continue
        pick = predicted_top_1x2(p)
        price = as_float({"home": q["home_price"], "draw": q["draw_price"], "away": q["away_price"]}[pick])
        if not price:
            continue
        n += 1
        staked += 1.0
        if pick == actual_1x2(match):
            pnl += price - 1.0
            wins += 1
        else:
            pnl -= 1.0
    return {
        "bets": n, "staked": staked, "pnl": pnl,
        "roi": (pnl / staked) if staked else 0.0,
        "win_rate": (wins / n) if n else 0.0,
    }


def simulate_edge_threshold_profit(predictions, matches, prices, threshold):
    """Flat 1 unit on EVERY selection whose edge (model_prob - 1/price) >= threshold.
    Flat staking isolates the threshold's effect for the sweep in report.py."""
    pr = _by_id(prices)
    staked = pnl = wins = n = 0
    for p, match in _pairs(predictions, matches):
        q = pr.get(p["match_id"])
        if not q:
            continue
        h, d, a = model_probs(p)
        act = actual_1x2(match)
        for sel, prob, price_s in (
            ("home", h, q["home_price"]),
            ("draw", d, q["draw_price"]),
            ("away", a, q["away_price"]),
        ):
            price = as_float(price_s)
            if not price:
                continue
            if prob - implied_prob(price) >= threshold:
                n += 1
                staked += 1.0
                if sel == act:
                    pnl += price - 1.0
                    wins += 1
                else:
                    pnl -= 1.0
    return {
        "bets": n, "staked": staked, "pnl": pnl,
        "roi": (pnl / staked) if staked else 0.0,
        "win_rate": (wins / n) if n else 0.0,
        "threshold": threshold,
    }
