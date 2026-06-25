"""
report.py — run the full walk-forward backtest on sample_data/ and print a report.

Also writes the two OUTPUT tables:
  sample_data/recommended_bets.csv     (decision engine output)
  sample_data/results_evaluation.csv   (per-match scoring)

Usage:
  python3 report.py [data_dir]     # defaults to ./sample_data
"""

from __future__ import annotations

import math
import os
import sys

import schema
from schema import as_float, as_bool
import backtest as bt
import decision_engine as de


def load_all(data_dir):
    matches = schema.load_csv(os.path.join(data_dir, "matches.csv"))
    predictions = schema.load_csv(os.path.join(data_dir, "predictions.csv"))
    prices = schema.load_csv(os.path.join(data_dir, "market_prices.csv"))
    schema.validate_columns(matches, schema.MATCHES_COLUMNS, "matches.csv")
    schema.validate_columns(predictions, schema.PREDICTIONS_COLUMNS, "predictions.csv")
    schema.validate_columns(prices, schema.MARKET_PRICES_COLUMNS, "market_prices.csv")
    ctx_path = os.path.join(data_dir, "match_context.csv")
    context = schema.load_csv(ctx_path) if os.path.exists(ctx_path) else []
    return matches, predictions, prices, context


def build_context_map(context):
    out = {}
    for row in context:
        ctx = {"is_third_round": as_bool(row.get("is_third_round")),
               "fav_side": (row.get("fav_side") or "none").strip()}
        for flag in de.THIRD_ROUND_FLAGS:
            ctx[flag] = as_bool(row.get(flag))
        out[row["match_id"]] = ctx
    return out


def write_recommended_bets(data_dir, matches, predictions, prices, ctx_map):
    pr = {q["match_id"]: q for q in prices}
    rows = []
    for p in predictions:
        q = pr.get(p["match_id"])
        if not q:
            continue
        probs = bt.model_probs(p)
        price_tuple = (as_float(q["home_price"]), as_float(q["draw_price"]), as_float(q["away_price"]))
        rec = de.recommend_match(probs, price_tuple, ctx=ctx_map.get(p["match_id"]))
        rows.append({
            "match_id": p["match_id"], "timestamp": q["timestamp"],
            "market": rec["market"], "selection": rec["selection"],
            "market_price": rec["market_price"], "model_probability": rec["model_probability"],
            "edge": rec["edge"], "recommended_stake_units": rec["recommended_stake_units"],
            "recommendation": rec["recommendation"], "reason": rec["reason"],
        })
    schema.write_csv(os.path.join(data_dir, "recommended_bets.csv"),
                     schema.RECOMMENDED_BETS_COLUMNS, rows)
    return rows


def write_results_evaluation(data_dir, matches, predictions):
    m = {x["match_id"]: x for x in matches}
    rows = []
    for p in predictions:
        match = m.get(p["match_id"])
        if not match or match["final_home_goals"] == "":
            continue
        h, d, a = bt.model_probs(p)
        act = bt.actual_1x2(match)
        top = bt.predicted_top_1x2(p)
        y = (1 if act == "home" else 0, 1 if act == "draw" else 0, 1 if act == "away" else 0)
        brier = (h - y[0]) ** 2 + (d - y[1]) ** 2 + (a - y[2]) ** 2
        pa = {"home": h, "draw": d, "away": a}[act]
        ll = -math.log(max(bt.EPS, pa))
        ascore = bt.actual_score(match)
        top3 = {p["top1_score"].strip(), p["top2_score"].strip(), p["top3_score"].strip()}
        rows.append({
            "match_id": p["match_id"], "actual_1x2": act, "predicted_top_1x2": top,
            "hit_1x2": int(top == act), "actual_score": ascore,
            "top1_score_hit": int(p["top1_score"].strip() == ascore),
            "top3_score_hit": int(ascore in top3),
            "brier_score": round(brier, 4), "log_loss": round(ll, 4),
        })
    schema.write_csv(os.path.join(data_dir, "results_evaluation.csv"),
                     schema.RESULTS_EVALUATION_COLUMNS, rows)
    return rows


def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "sample_data")
    matches, predictions, prices, context = load_all(data_dir)
    ctx_map = build_context_map(context)

    print("=" * 64)
    print("  WORLD CUP PREDICTION + BETTING BACKTEST  (walk-forward)")
    print("=" * 64)
    issues = schema.warn_if_not_walk_forward(matches, predictions, prices)
    scored = sum(1 for _ in bt._pairs(predictions, matches))
    print(f"Matches scored: {scored}   walk-forward violations: {issues}\n")

    # ── Prediction accuracy (separate from betting) ──────────────────────────
    print("-- PREDICTION ACCURACY --------------------------------------------")
    print(f"1X2 top-pick accuracy ............. {bt.evaluate_1x2_accuracy(predictions, matches)*100:5.1f}%")
    print(f"  decisive games only (no draws) .. {bt.evaluate_decisive_game_accuracy(predictions, matches)*100:5.1f}%")
    print(f"Top-1 exact scoreline ............. {bt.evaluate_top1_score_accuracy(predictions, matches)*100:5.1f}%")
    print(f"Top-3 exact scoreline ............. {bt.evaluate_top3_score_accuracy(predictions, matches)*100:5.1f}%")
    print(f"Brier score (lower better) ........ {bt.calculate_brier_score(predictions, matches):.4f}")
    print(f"Log loss   (lower better) ......... {bt.calculate_log_loss(predictions, matches):.4f}")

    cal = bt.calculate_calibration_bins(predictions, matches)
    print("\nCalibration (pooled 1X2 outcomes):")
    print("  bucket      n   mean_pred  observed   gap")
    for b in cal["bins"]:
        print(f"  {b['label']:<9} {b['n']:>3}   {b['mean_pred']*100:6.0f}%   {b['observed']*100:6.0f}%   {b['gap']*100:+5.0f}%")
    print(f"  ECE: {cal['ece']*100:.1f}%")

    # ── Betting profitability (the SEPARATE question) ────────────────────────
    print("\n-- BETTING SIMULATION (flat 1u; isolates the effect) --------------")
    flat = bt.simulate_flat_stake_profit(predictions, matches, prices)
    print(f"Flat-stake on model top pick: {flat['bets']} bets, "
          f"win {flat['win_rate']*100:.0f}%, ROI {flat['roi']*100:+.1f}%  (pnl {flat['pnl']:+.2f}u)")
    print("\nROI by edge threshold (edge = model_prob - 1/price, i.e. over the vig-laden price):")
    print("  threshold   bets   win%    staked     pnl       ROI")
    for thr in (0.00, 0.05, 0.07, 0.08, 0.10, 0.15):
        s = bt.simulate_edge_threshold_profit(predictions, matches, prices, thr)
        roi = f"{s['roi']*100:+.1f}%" if s["bets"] else "  n/a"
        print(f"  {thr*100:>5.0f}pp   {s['bets']:>4}   {s['win_rate']*100:>3.0f}%   {s['staked']:>6.2f}u   {s['pnl']:>+6.2f}u   {roi:>7}")

    # ── Decision engine output ───────────────────────────────────────────────
    recs = write_recommended_bets(data_dir, matches, predictions, prices, ctx_map)
    write_results_evaluation(data_dir, matches, predictions)
    bet_rows = [r for r in recs if r["recommendation"] == "BET"]
    print(f"\n-- DECISION ENGINE -------------------------------------------------")
    print(f"Recommendations: {len(recs)} matches → {len(bet_rows)} BET, {len(recs)-len(bet_rows)} NO BET")
    for r in bet_rows:
        print(f"  BET {r['match_id']}: {r['selection']} @ {r['market_price']} "
              f"(edge {float(r['edge'])*100:+.1f}pp, {r['recommended_stake_units']}u)")
    print("  (full detail in sample_data/recommended_bets.csv)")

    # ── Honesty banner ───────────────────────────────────────────────────────
    print("\n" + "!" * 64)
    print("  LIMITATIONS — read before trusting any ROI above")
    print("!" * 64)
    print(f"  • {scored} matches is FAR too few to prove betting skill (need ~500+).")
    print("    Any positive ROI here is NOISE, not edge. Do NOT size up on it.")
    print("  • Sample data is illustrative; market prices are synthetic.")
    print("  • Under realistic 竞彩 ~13% vig the long-run expectation is NEGATIVE;")
    print("    a calibrated model still loses to the vig. Prediction != profit.")
    print("  • The model is only honest if it outputs NO BET when the price is fair.")


if __name__ == "__main__":
    main()
