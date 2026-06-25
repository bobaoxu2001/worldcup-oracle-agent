"""
Betting decision engine — disciplined, price-first, NO-BET by default.

THE ONE IDEA THAT MATTERS
-------------------------
Edge is measured against the RAW, vig-laden price (1 / decimal_odds), NOT the
de-vigged "fair" line. That choice is deliberate and it is the whole point:

    EV per 1 unit staked = model_prob * price - 1 = price * (model_prob - 1/price)

So `edge = model_prob - 1/price` is positive **iff** the bet is +EV — the vig is
already inside the price. Requiring edge >= 0.05 therefore demands a real margin
ON TOP of the bookmaker's cut, instead of the classic trap of comparing the model
to the de-vigged line (where a "5% edge" can still be -EV once the cut is paid).

We also report the de-vigged fair probability for transparency, but the GATE uses
the price. Default output is NO BET. Correct-score is entertainment only — never a
staked recommendation.
"""

from __future__ import annotations

# ── Required edge per market (probability points over the raw price) ─────────
REQUIRED_EDGE = {
    "pre_match_single": 0.05,
    "live": 0.07,
    "draw": 0.08,
    # correct_score is handled separately — entertainment only, never staked.
}
CORRECT_SCORE_POLICY = "entertainment_only"

# ── Stake sizing (units). Never all-in. ──────────────────────────────────────
MAX_STAKE = 1.0
STRONG_EDGE = 0.10        # edge at/above this is a "strong" edge
STAKE_STRONG = 1.0
STAKE_MODERATE = 0.5
STAKE_DRAW = 0.25         # draws are high-variance → capped small
STAKE_LIVE_LATE_CHASE = 0.1

# ── Third-round World Cup correction rules (encoded as named flags) ──────────
# Some are PROBABILITY nudges (capped); some are GUARDS/PRINCIPLES enforced by
# the engine's structure. All are opt-in per match via match_context.csv.
THIRD_ROUND_FLAGS = [
    "locked_first_does_not_equal_relax",
    "rotation_can_increase_motivation",
    "draw_logic_requires_price_edge",
    "must_win_underdog_gets_intensity_boost",
    "stronger_team_with_draw_enough_gets_win_probability_downgrade",
    "home_favorite_gets_effort_boost",
    "live_model_must_update_aggressively_after_goal",
]
# Capped magnitudes for the nudge-type flags (probability points).
FAV_DRAW_DOWNGRADE = 0.05   # stronger team that only needs a draw: win -> draw
UNDERDOG_INTENSITY = 0.03   # must-win underdog: fav win -> underdog win
HOME_EFFORT_BOOST = 0.03    # home favourite effort: draw -> home win


def implied_prob(price):
    """Raw implied probability of a decimal price (includes the vig)."""
    return 1.0 / price if price and price > 0 else 0.0


def devig(home_price, draw_price, away_price):
    """De-vigged ('fair') 1X2 probabilities — normalised to sum to 1."""
    imp = [implied_prob(home_price), implied_prob(draw_price), implied_prob(away_price)]
    s = sum(imp)
    if s <= 0:
        return (0.0, 0.0, 0.0), 0.0
    fair = tuple(x / s for x in imp)
    overround = s - 1.0  # the bookmaker's cut
    return fair, overround


def _renorm(h, d, a):
    h, d, a = max(0.0, h), max(0.0, d), max(0.0, a)
    s = h + d + a
    if s <= 0:
        return 1 / 3, 1 / 3, 1 / 3
    return h / s, d / s, a / s


def apply_third_round_corrections(h, d, a, ctx):
    """
    Apply the capped third-round probability nudges that are active in `ctx`
    (a dict of flag -> bool plus 'fav_side' in {'home','away','none'}).
    Returns (h, d, a, applied_notes). Guard/principle flags add a note but no
    numeric change (they are enforced by the engine's structure, see README).
    """
    notes = []
    if not ctx or not ctx.get("is_third_round"):
        return h, d, a, notes
    fav = ctx.get("fav_side", "none")

    # Guard flags — documented, no auto-penalty is applied in the first place.
    if ctx.get("locked_first_does_not_equal_relax"):
        notes.append("guard:locked_first!=relax (no auto-downgrade for being qualified)")
    if ctx.get("rotation_can_increase_motivation"):
        notes.append("guard:rotation!=low_effort")
    if ctx.get("draw_logic_requires_price_edge"):
        notes.append("principle:draw needs 8pp price edge (enforced at gate)")
    if ctx.get("live_model_must_update_aggressively_after_goal"):
        notes.append("principle:live exit-fast on a goal")

    # Nudge: a stronger team that only needs a draw pushes less → win -> draw.
    if ctx.get("stronger_team_with_draw_enough_gets_win_probability_downgrade") and fav in ("home", "away"):
        if fav == "home":
            move = min(FAV_DRAW_DOWNGRADE, h)
            h, d = h - move, d + move
        else:
            move = min(FAV_DRAW_DOWNGRADE, a)
            a, d = a - move, d + move
        notes.append(f"nudge:fav_draw_downgrade(-{move:.2f} win -> draw)")

    # Nudge: a must-win underdog brings intensity → fav win -> underdog win.
    if ctx.get("must_win_underdog_gets_intensity_boost") and fav in ("home", "away"):
        if fav == "home":
            move = min(UNDERDOG_INTENSITY, h)
            h, a = h - move, a + move
        else:
            move = min(UNDERDOG_INTENSITY, a)
            a, h = a - move, h + move
        notes.append(f"nudge:underdog_intensity(+{move:.2f} to underdog)")

    # Nudge: a HOME favourite gets an effort boost at home → draw -> home win.
    if ctx.get("home_favorite_gets_effort_boost") and fav == "home":
        move = min(HOME_EFFORT_BOOST, d)
        d, h = d - move, h + move
        notes.append(f"nudge:home_effort(+{move:.2f} to home)")

    h, d, a = _renorm(h, d, a)
    return h, d, a, notes


def _stake_for(edge, market, is_live, late_chase):
    if market == "draw":
        return STAKE_DRAW
    if is_live:
        if late_chase:
            return STAKE_LIVE_LATE_CHASE
        return STAKE_STRONG if edge >= STRONG_EDGE else STAKE_MODERATE
    # pre-match single
    return STAKE_STRONG if edge >= STRONG_EDGE else STAKE_MODERATE


def evaluate_selection(model_prob, price, market, is_live=False, late_chase=False):
    """
    Decide a single selection. Returns a dict with edge, stake and recommendation.
    `market` in {'pre_match_single','draw','live','correct_score'}.
    """
    if market == "correct_score":
        return {
            "market": market, "model_probability": model_prob, "market_price": price,
            "edge": None, "recommended_stake_units": 0.0,
            "recommendation": "NO BET", "reason": "correct-score is entertainment only",
        }
    edge = model_prob - implied_prob(price)
    required = REQUIRED_EDGE["live"] if is_live else REQUIRED_EDGE.get(market, REQUIRED_EDGE["pre_match_single"])
    if edge >= required:
        stake = min(MAX_STAKE, _stake_for(edge, market, is_live, late_chase))
        return {
            "market": market, "model_probability": model_prob, "market_price": price,
            "edge": edge, "recommended_stake_units": stake, "recommendation": "BET",
            "reason": f"edge {edge*100:.1f}pp >= {required*100:.0f}pp over the price (EV {price*model_prob-1:+.2f}/u)",
        }
    return {
        "market": market, "model_probability": model_prob, "market_price": price,
        "edge": edge, "recommended_stake_units": 0.0, "recommendation": "NO BET",
        "reason": f"edge {edge*100:.1f}pp < {required*100:.0f}pp required — price fair/expensive",
    }


def recommend_match(model_probs, prices, ctx=None, is_live=False, late_chase=False):
    """
    Produce ONE decision for a match: the best qualifying bet across home/draw/away,
    or NO BET. `model_probs` = (home, draw, away); `prices` = (home, draw, away).
    Third-round corrections (if ctx) are applied to the probs BEFORE the gate.
    """
    h, d, a = model_probs
    h, d, a, notes = apply_third_round_corrections(h, d, a, ctx or {})
    fair, overround = devig(*prices)

    candidates = [
        ("home", evaluate_selection(h, prices[0], "live" if is_live else "pre_match_single", is_live, late_chase)),
        ("draw", evaluate_selection(d, prices[1], "draw", is_live, late_chase)),
        ("away", evaluate_selection(a, prices[2], "live" if is_live else "pre_match_single", is_live, late_chase)),
    ]
    bets = [(sel, r) for sel, r in candidates if r["recommendation"] == "BET"]

    if not bets:
        best_edge = max((r["edge"] for _, r in candidates if r["edge"] is not None), default=0.0)
        return {
            "selection": "none", "market": "1x2", "market_price": "",
            "model_probability": "", "edge": round(best_edge, 4),
            "recommended_stake_units": 0.0, "recommendation": "NO BET",
            "reason": f"no selection clears its edge threshold (best {best_edge*100:.1f}pp); overround {overround*100:.1f}%"
                      + (f"; {'; '.join(notes)}" if notes else ""),
        }

    # Pick the highest-edge qualifying bet.
    sel, r = max(bets, key=lambda x: x[1]["edge"])
    reason = r["reason"] + (f"; {'; '.join(notes)}" if notes else "")
    return {
        "selection": sel, "market": r["market"], "market_price": r["market_price"],
        "model_probability": round(r["model_probability"], 4), "edge": round(r["edge"], 4),
        "recommended_stake_units": r["recommended_stake_units"],
        "recommendation": "BET", "reason": reason,
    }
