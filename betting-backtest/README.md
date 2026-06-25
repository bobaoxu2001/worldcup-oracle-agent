# World Cup Prediction + Betting Backtest

A small, reproducible Python project that **separates two questions that are
constantly confused**:

1. **Is the model a good _predictor_?** (accuracy, calibration)
2. **Is there a profitable _bet_?** (price edge, after the vig)

The whole point is discipline: it records predictions **before** matches, scores
them **after**, and recommends a bet **only when the price gives a real edge** —
otherwise it says **NO BET**. It exists because narrative reasoning ("a draw makes
sense", "the favourite already qualified", "the stronger team should win") kept
producing confident, losing recommendations. None of those are reasons to bet.

> ⚠️ **It does not promise profit.** A well-calibrated model still loses to a
> ~13% vig. Read the *Limitations* section before trusting any ROI number.

---

## The one idea that matters: edge is measured against the price, not the "fair" line

For a decimal price `p` and your model probability `m`:

```
EV per 1 unit staked = m * p - 1 = p * (m - 1/p)
```

So we define **`edge = model_prob - 1/price`**. It is positive **iff the bet is
+EV** — because `1/price` already contains the bookmaker's cut (the vig). 

This is the disciplined choice. The classic trap is to compare your model to the
**de-vigged ("fair") line**: there a "5% edge" can still be **−EV** once you pay
the cut. We show the de-vigged fair probability for transparency, but the **bet
gate uses the raw price**. Requiring `edge ≥ 5pp` therefore demands a genuine
margin *on top of* the vig.

Worked example (the trap, with ~13% overround): if the de-vigged fair prob is
50%, the price implies ~56.5%. You must believe **>56.5%** just to break even —
so an "edge vs fair" of up to ~6.5pp is actually a losing bet. This system would
correctly call that **NO BET**.

---

## Quick start

```bash
cd betting-backtest
python3 report.py            # runs on ./sample_data, prints the report
python3 report.py /path/to/your_data   # point at your own CSVs
```

No dependencies — standard library only (Python 3.8+).

`report.py` prints accuracy + calibration + ROI-by-edge-threshold, and writes two
output tables into the data dir: `recommended_bets.csv` and `results_evaluation.csv`.

---

## Files

| File | Purpose |
|---|---|
| `schema.py` | column specs for every table + CSV load/validate helpers |
| `decision_engine.py` | the betting rules (edge gate, stakes, NO-BET default, third-round flags) |
| `backtest.py` | walk-forward evaluation functions (accuracy, Brier, log-loss, calibration, profit sims) |
| `report.py` | runs everything, prints the report, writes the output CSVs |
| `skills.md` | the V6.6 rule set this project encodes |
| `sample_data/` | 13 illustrative matches (real WC2026 results, synthetic prices) |

## Data schema

**Inputs**

- `matches.csv` — `match_id, date, group, home_team, away_team, venue, neutral_or_home_context, kickoff_time, final_home_goals, final_away_goals`
- `predictions.csv` — `match_id, prediction_timestamp, predicted_home_win_prob, predicted_draw_prob, predicted_away_win_prob, top1_score, top2_score, top3_score, model_version, notes`
- `market_prices.csv` — `match_id, timestamp, home_price, draw_price, away_price, source` (decimal odds)
- `match_context.csv` *(optional)* — third-round rule flags per match (see below)

**Outputs (generated)**

- `recommended_bets.csv` — `match_id, timestamp, market, selection, market_price, model_probability, edge, recommended_stake_units, recommendation, reason`
- `results_evaluation.csv` — `match_id, actual_1x2, predicted_top_1x2, hit_1x2, actual_score, top1_score_hit, top3_score_hit, brier_score, log_loss`

---

## Walk-forward only (no look-ahead)

- Predictions and market prices must be timestamped **strictly before** kickoff.
  `report.py` warns on any violation.
- **Nothing in this project fits or tunes on `final_*_goals`.** Predictions are
  read as-is and only *scored*, so the evaluation is walk-forward by construction.
  There is no parameter optimisation against results — by design, so you cannot
  accidentally curve-fit the past.

---

## Backtest functions (`backtest.py`)

`evaluate_1x2_accuracy`, `evaluate_decisive_game_accuracy` (excludes draws — the
fair "did it pick the right side" number, since a 1X2 model rarely makes the draw
its modal pick), `evaluate_top1_score_accuracy`, `evaluate_top3_score_accuracy`,
`calculate_brier_score`, `calculate_log_loss`, `calculate_calibration_bins`,
`simulate_flat_stake_profit`, `simulate_edge_threshold_profit`.

## Betting decision rules (`decision_engine.py`)

- **NO BET unless `model_prob - 1/price ≥ required_edge`.**
- Required edge: `pre_match_single = 0.05`, `live = 0.07`, `draw = 0.08`,
  `correct_score = entertainment only` (never staked).
- Max stake (never all-in, cap 1.0u): `strong (edge≥10pp) = 1.0`, `moderate = 0.5`,
  `draw = 0.25`, `live late chase = 0.1`.
- Default output is **NO BET**; a fair or expensive price always returns NO BET.

## Third-round World Cup corrections (rule flags)

Opt-in per match via `match_context.csv`. Two kinds:

**Probability nudges (capped):**
- `stronger_team_with_draw_enough_gets_win_probability_downgrade` — favourite win → draw (−0.05)
- `must_win_underdog_gets_intensity_boost` — favourite win → underdog win (+0.03)
- `home_favorite_gets_effort_boost` — draw → home win (+0.03, home favourite only)

**Guards / principles (enforced by structure, no silent penalty):**
- `locked_first_does_not_equal_relax` — a qualified team is **not** auto-downgraded
- `rotation_can_increase_motivation` — rotation is not treated as low effort
- `draw_logic_requires_price_edge` — a draw still needs the 8pp price edge
- `live_model_must_update_aggressively_after_goal` — live theses exit fast on a goal

In the sample, this layer turns Türkiye's marginal +5pp pre-match edge into NO BET
(the `stronger_team...downgrade`), and Türkiye then lost — the rule avoided a losing bet.

---

## Limitations (read this)

- **Sample size.** 13 matches cannot distinguish skill from luck; you need ~500+
  settled bets. **Any positive ROI in the sample is noise.** Do not size up on it.
- **The vig wins long-run.** Under realistic 竞彩 (~13%) overround, the expected
  value of betting is negative even for a calibrated model. Prediction accuracy
  ≠ betting profit. This tool's job is to make you bet **less**, not more.
- **Sample prices are synthetic** and illustrative; plug in real captured odds.
- **Correct-score is entertainment only** — its vig (30–41%) makes it the worst
  market on the board; the engine never stakes it.
- **No profitability is claimed.** If the backtest on *your* real, large dataset
  does not show a positive ROI with a sane confidence interval, the honest answer
  is: don't bet.
