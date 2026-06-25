"""
Data schemas + tiny CSV helpers for the betting-backtest project.

Pure standard library (no pandas) so the project runs anywhere with python3.
Each table's columns are declared here so the loaders can validate inputs and
fail loudly on a malformed file rather than silently mis-scoring a prediction.

Tables
------
matches.csv            one row per fixture, WITH the final score (the ground truth)
predictions.csv        the model's PRE-MATCH 1X2 probs + top-3 scorelines
market_prices.csv      decimal odds (home/draw/away) captured PRE-MATCH
match_context.csv      optional third-round rule flags per match (see decision_engine)
recommended_bets.csv   OUTPUT of the decision engine (one row per recommendation)
results_evaluation.csv OUTPUT of the backtest (one row per scored match)

Walk-forward contract
---------------------
`prediction_timestamp` and the market `timestamp` MUST be strictly before
`kickoff_time`. The loaders warn if not. Nothing in this project ever fits a
model on `final_*_goals` — predictions are read as-is and only SCORED, so the
evaluation is walk-forward by construction.
"""

from __future__ import annotations

import csv
import os
import sys

# ── Column specifications (the canonical schema) ────────────────────────────
MATCHES_COLUMNS = [
    "match_id", "date", "group", "home_team", "away_team", "venue",
    "neutral_or_home_context", "kickoff_time", "final_home_goals", "final_away_goals",
]
PREDICTIONS_COLUMNS = [
    "match_id", "prediction_timestamp", "predicted_home_win_prob",
    "predicted_draw_prob", "predicted_away_win_prob", "top1_score", "top2_score",
    "top3_score", "model_version", "notes",
]
MARKET_PRICES_COLUMNS = [
    "match_id", "timestamp", "home_price", "draw_price", "away_price", "source",
]
RECOMMENDED_BETS_COLUMNS = [
    "match_id", "timestamp", "market", "selection", "market_price",
    "model_probability", "edge", "recommended_stake_units", "recommendation", "reason",
]
RESULTS_EVALUATION_COLUMNS = [
    "match_id", "actual_1x2", "predicted_top_1x2", "hit_1x2", "actual_score",
    "top1_score_hit", "top3_score_hit", "brier_score", "log_loss",
]
# Optional table: third-round rule flags (booleans) keyed by match_id.
MATCH_CONTEXT_COLUMNS = [
    "match_id", "is_third_round", "fav_side",
    "locked_first_does_not_equal_relax",
    "rotation_can_increase_motivation",
    "draw_logic_requires_price_edge",
    "must_win_underdog_gets_intensity_boost",
    "stronger_team_with_draw_enough_gets_win_probability_downgrade",
    "home_favorite_gets_effort_boost",
    "live_model_must_update_aggressively_after_goal",
]


def load_csv(path):
    """Read a CSV into a list of dict rows (all values are strings)."""
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path, columns, rows):
    """Write list-of-dicts `rows` to `path` with the given column order."""
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columns)
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in columns})


def validate_columns(rows, expected, name):
    """Raise if the loaded rows are missing any expected column."""
    if not rows:
        return
    missing = [c for c in expected if c not in rows[0]]
    if missing:
        raise ValueError(f"{name}: missing columns {missing}")


def as_float(x, default=None):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def as_bool(x):
    return str(x).strip().lower() in ("1", "true", "yes", "y", "t")


def parse_score(s):
    """'2-1' -> (2, 1); returns None on a malformed string."""
    try:
        h, a = str(s).split("-")
        return int(h), int(a)
    except (ValueError, AttributeError):
        return None


def warn_if_not_walk_forward(matches, predictions, prices):
    """Print a warning for any prediction/price timestamped at/after kickoff."""
    kickoff = {m["match_id"]: m["kickoff_time"] for m in matches}
    issues = 0
    for p in predictions:
        ko = kickoff.get(p["match_id"])
        if ko and p["prediction_timestamp"] >= ko:
            print(f"  ⚠️  {p['match_id']}: prediction at/after kickoff "
                  f"({p['prediction_timestamp']} >= {ko}) — NOT walk-forward", file=sys.stderr)
            issues += 1
    for q in prices:
        ko = kickoff.get(q["match_id"])
        if ko and q["timestamp"] >= ko:
            print(f"  ⚠️  {q['match_id']}: market price at/after kickoff "
                  f"({q['timestamp']} >= {ko})", file=sys.stderr)
            issues += 1
    return issues
