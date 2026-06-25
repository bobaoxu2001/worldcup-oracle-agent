# Football Prediction & Betting Skill — V6.6 (Third-Round Discipline, code-backed)

This is the rule set the project **encodes and enforces in code** (not just prose).
Where a rule maps to an implementation, the file is named.

## 0. Prime directive: do not turn a narrative into a bet

A *prediction* and a *bet* are different outputs. Better football understanding
improves the **prediction**; it does **not** create a **bet** unless the price is
wrong. A pick is a valid BET only when **all three** hold:

1. Match logic supports the direction.
2. Motivation / context supports it (third-round rules, §4).
3. **The price pays for the risk** — `edge = model_prob − 1/price ≥ required_edge`.

If the price is fair or expensive → **NO BET**. (`decision_engine.recommend_match`)

## 1. Edge is over the price, not the "fair" line

`EV = model_prob · price − 1 = price · (model_prob − 1/price)`. So edge is measured
against the raw, vig-laden price. A positive edge already clears the vig. Comparing
to the de-vigged line is the classic way to talk yourself into a −EV bet.
(`decision_engine.evaluate_selection`)

## 2. Required edge & stakes (never all-in)

| Market | Required edge | Stake |
|---|---|---|
| Pre-match single | 5pp | 1.0u (edge ≥10pp) / 0.5u |
| Live | 7pp | 1.0u/0.5u, or 0.1u late chase |
| Draw | 8pp | 0.25u (capped — draws are high-variance) |
| Correct score | — | **entertainment only, never staked** |

No revenge betting, no doubling after a miss, no chasing. Default = **NO BET**.

## 3. Draws are not main bets on narrative

A draw is a bet **only** when the price gives ≥8pp edge — never because "both can
qualify", "the favourite is through", or "it feels like 1-1". (Enforced by the 8pp
gate + `draw_logic_requires_price_edge`.)

## 4. Third-round corrections (rule flags — `decision_engine`, `match_context.csv`)

**Probability nudges (capped):**
- `stronger_team_with_draw_enough_gets_win_probability_downgrade` — a strong side
  that only needs a draw pushes less: shift win→draw (−0.05).
- `must_win_underdog_gets_intensity_boost` — a must-win underdog brings intensity:
  fav win → underdog win (+0.03). But upgrade **double chance / draw / underdog
  goal**, not blindly the underdog full-time win.
- `home_favorite_gets_effort_boost` — a home favourite keeps effort even when
  qualified: draw → home win (+0.03).

**Guards / principles:**
- `locked_first_does_not_equal_relax` — a qualified team is **not** auto-faded.
  A rotated, deep, home favourite can still win big.
- `rotation_can_increase_motivation` — rotation ≠ low effort (fresh legs, bench
  players auditioning). Do not over-downgrade.
- `live_model_must_update_aggressively_after_goal` — if a pre-match thesis dies
  (a goal changes the state), exit fast; don't average down without new evidence.

## 5. The "stronger team" trap

Do not back a team to win just because it is stronger. Fade the *win bet* (prefer
NO BET / double chance) when a draw is enough for it, its key attacker is benched,
it lacks urgency, or the price is short. (This is exactly what the §4 downgrade +
the price gate do together — in the sample it converts Türkiye to NO BET.)

## 6. Prediction metrics ≠ profit (`backtest.py`)

Track both, separately:
- **Prediction:** 1X2 accuracy, decisive-game accuracy, top-1 / top-3 scoreline,
  Brier, log-loss, calibration (ECE).
- **Profit:** flat-stake ROI and ROI **by edge threshold**, walk-forward.

Top-pick "accuracy" is a weak metric (draws are structurally never the modal pick)
— trust Brier / log-loss / calibration, and judge betting only by ROI on a
**large** sample.

## 7. Honesty rules

- Walk-forward only. Never optimise on future results. (`schema.warn_if_not_walk_forward`)
- Do **not** claim profitability unless a large backtest proves it with a sane
  confidence interval. A few winning bets is noise.
- Under ~13% vig the long-run expectation is negative; the correct default is to
  bet less. When the edge isn't clear, the answer is **NO BET**.

## 8. Default decision hierarchy (when unsure)

1. NO BET
2. Double chance / no-loss market
3. Small draw protection (only with the 8pp edge)
4. Moneyline (only with clear edge)
5. Correct score — tiny entertainment stake only
