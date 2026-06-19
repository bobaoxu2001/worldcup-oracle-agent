# V5.1 Football Prediction & Betting Skill

## Purpose

Use this skill to analyze World Cup football matches with a V5.1 model that combines market odds, squad strength, tactical matchup, qualification quality, and betting-market value.

The goal is **not** to predict every match perfectly. The goal is to separate:

1. Most likely result
2. Best-value result
3. Correct-score script
4. Chinese Sports Lottery constraints
5. Risk-adjusted staking plan

Core principle:

> Do not ask only “who is stronger?”  
> Ask “is the price worth the probability?”

---

## V5.1 Model Philosophy

V5.1 was created after early World Cup group-stage review. The key lesson was that low-profile teams cannot be treated as weak just because of low market attention, low FIFA rank, or lower squad value.

Recent examples:

- **Ghana 1-0 Panama** confirmed that qualification quality, athletic edge, and available squad depth can outweigh public fear around missing stars.
- **Portugal 1-1 DR Congo** confirmed that a famous favorite with high talent can still fail to win or cover when the underdog has real resistance and transition outlets.
- **England 4-2 Croatia** showed that tournament experience matters, but it must be capped when the favorite’s Kill Index is high enough.
- **Cape Verde 0-0 Spain** type scripts show why qualification path and defensive maturity must be treated as first-class inputs.

---

## Required Inputs

Before giving a prediction, collect or estimate:

### 1. Market Information

Required:

- Chinese Sports Lottery 1X2 odds
- Chinese Sports Lottery handicap odds
- Whether a market can be bought as single or only in parlays
- External market odds if available
- Market-implied probability

Formula:

```text
implied_probability = 1 / odds
EV = model_probability * odds - 1
```

Use actual listed odds for EV. Use no-vig probabilities only for market-bias comparison.

---

### 2. Squad & Availability

Check:

- Key absences
- Actual available squad value
- Whether absences affect the tactical spine:
  - goalkeeper
  - center back
  - defensive midfielder
  - main creator
  - main finisher
- Whether replacements are system-compatible

Rule:

> A missing star matters less if the team still has a stable structure.  
> A missing spine player matters more than raw market value suggests.

Example:

Ghana missing Partey/Kudus reduces midfield control and creativity, but Ghana still retained athletic edge and enough squad quality against Panama.

---

### 3. Qualification Quality Index

This is the major V5.1 upgrade.

Do not only look at FIFA rank or squad value. Check how the team qualified.

Important signals:

- Direct group winner
- Points per game
- Goal difference
- Home/away stability
- Clean-sheet record
- Strength of opponents beaten
- Whether they finished above traditionally stronger teams
- Whether qualification was dominant or playoff-based
- Whether progress reflects a multi-year trend

Interpretation:

- Direct group winner with strong record = raise Resistance and confidence
- Playoff survivor = raise mentality but lower stability
- Expansion beneficiary / weak path = do not overrate

Rule:

> A low-profile direct qualifier is often much stronger than the public market assumes.

---

### 4. Kill Index

Kill Index measures whether the stronger side can actually break the opponent.

High Kill Index factors:

- Direct pace behind the back line
- Elite striker or penalty-box finisher
- Multiple creators
- Strong set pieces
- High pressing causing turnovers
- Ability to score early
- Bench attackers who change game state

Low Kill Index factors:

- Slow possession without penetration
- Overreliance on one creator
- Poor finishing
- Weak transition attack
- Injury to wide outlets
- Lack of aerial threat

Rule:

> Stronger team does not automatically mean cover.  
> The question is whether they have the tools to make the underdog’s defense collapse.

---

### 5. Resistance Index

Resistance Index measures whether the underdog can keep the match alive.

High Resistance factors:

- Compact low block
- Good goalkeeper
- Strong center backs
- Transition outlet
- Set-piece threat
- Qualification quality
- Tournament experience
- Coach continuity
- Ability to survive the first 30 minutes

Low Resistance factors:

- Poor build-up under pressure
- Weak defensive transitions
- Slow center backs
- No outlet after winning the ball
- Bad discipline
- Young team with panic risk
- Conceding early often

Rule:

> A favorite can dominate possession and still be a bad handicap bet if the underdog has resistance.

---

### 6. First-Goal Leverage

Ask:

- If favorite scores first, does the match open up?
- If underdog concedes first, can they still attack?
- If the game stays 0-0 for 30–45 minutes, who benefits?
- Does favorite become more dangerous after scoring?
- Does underdog collapse or stay compact?

Interpretation:

- Favorite scores first and underdog must open up → cover probability rises
- Underdog can stay compact even after conceding → exact one-goal/two-goal margin more likely
- 0-0 after halftime → draw and underdog handicap value increases

---

## Default V5.1 Weights

| Module | Weight |
|---|---:|
| Market no-vig probability | 25% |
| Squad/Elo/base strength | 10% |
| Lineup and injuries | 14% |
| Kill Index | 17% |
| Resistance Index | 12% |
| Qualification Quality | 10% |
| Tactical matchup | 9% |
| First-goal/game script | 8% |
| Weather/schedule/travel | 3% |
| News interpretation | 2% |

Adjust only with clear evidence.

---

## Match-Type Classification

Classify every match before betting.

### Type A: Fade Favorite

Favorite is famous but lacks direct kill power.

Common signs:

- Slow possession
- Injured creators
- Underdog has strong qualification quality
- Underdog can counter
- Market overprices favorite

Possible bets:

- Draw
- Underdog handicap
- Favorite handicap loss
- Low-scoring correct scores

---

### Type B: Trust Favorite

Favorite has enough kill power to break resistance.

Common signs:

- Direct speed
- Multiple scorers
- Strong pressing
- Underdog has poor build-up
- First goal likely opens the match

Possible bets:

- Favorite win
- Favorite handicap win
- Favorite exact margin
- 2-0 / 3-1 / 3-0 type scores

---

### Type C: Favorite Wins Narrowly

Favorite is stronger, but underdog resistance is real.

Common signs:

- Favorite likely wins but not by much
- Underdog has structure
- Qualification quality is solid
- Market prices favorite win too low
- Handicap exact margin has value

Possible bets:

- Favorite win if odds are high enough
- Underdog +1 draw result
- Favorite exact one-goal margin
- 1-0 / 2-1 / 0-1 / 1-2 scores

---

### Type D: True Coin-Flip / Draw-Heavy

Neither team has enough separation.

Common signs:

- Similar level
- Both sides conservative
- Tournament experience
- Strong midfield control from both
- Draw odds underpriced

Possible bets:

- Draw
- 1-1 / 0-0 correct score
- Double chance if available

---

## Chinese Sports Lottery Rules

Always use the **actual Chinese Sports Lottery handicap**. Never infer handicap from final score.

Examples:

- If actual market is France -1 and France wins 3-1:
  - Result is handicap win
  - Do not call it “-2 draw”
- If actual market is Ghana -1 and Ghana wins 1-0:
  - Result is handicap draw
- If actual market is Uzbekistan +1 and Colombia wins 1-0:
  - Result is handicap draw

Required tracking table:

| Match | Chinese handicap | Score | Handicap result | Model pick | Hit? |
|---|---:|---:|---|---|---|

---

## Single vs Parlay Constraint

Some Chinese Sports Lottery markets cannot be bought as singles.

Before recommending:

1. Check whether the market is single-eligible.
2. If it is parlay-only, do not recommend it as a single.
3. Avoid using low-value legs just to force a parlay.

Important rule:

> A low-odds favorite can make a parlay look safer while destroying EV.

Example:

Colombia win at 1.22 may be likely, but if the model gives 60–64% and breakeven is 82%, it is bad EV and should not be used as a parlay filler.

---

## EV Ranking Workflow

For every candidate bet:

1. Estimate model probability.
2. Calculate breakeven probability.
3. Calculate EV.
4. Check single/parlay restriction.
5. Check correlation with existing bets.
6. Decide stake.

Formula:

```text
breakeven = 1 / odds
EV = model_probability * odds - 1
```

Example:

```text
Ghana win odds = 2.44
V5.1 probability = 53%
EV = 0.53 * 2.44 - 1 = +29.3%
```

This is a strong value bet.

---

## Correlation Rule

Do not over-stack the same match unless the price is clearly exceptional.

Bad structure:

- 100 on Ghana win
- 50 on Ghana -1 draw
- 20 on Ghana correct score

Better structure:

- Main bet: Ghana win
- Extra budget: unrelated value from other matches

Rule:

> Once main exposure is already high, use remaining budget on uncorrelated value.

---

## Correct Score Rule

Correct score is for small staking only.

Use correct scores only when they overlap with the main script.

Examples:

- Ghana small win script: 1-0, 2-1
- Colombia narrow win script: 0-1, 1-2
- Strong favorite exact margin: 2-0, 3-1

Do not scatter many score bets. It dilutes bankroll.

Recommended score stake:

```text
5%–15% of total budget maximum
```

---

## Market Comparison Rule

If external market odds are much better than Chinese Sports Lottery, prefer the better market if rules, settlement, fees, and withdrawal are reliable.

Example:

| Market | Ghana win odds | Breakeven |
|---|---:|---:|
| Chinese Sports Lottery | 2.04 | 49.0% |
| External market | 2.44 | 41.0% |

If model probability is 53%, external market has much higher EV.

Rule:

> Same prediction, better price = better bet.

---

## Post-Match Review Protocol

After every match, record:

| Field | Description |
|---|---|
| Match | Teams |
| Market odds | Chinese and external |
| Model probability | 1X2 and handicap |
| Pick | Recommended bet |
| Stake | Amount |
| Result | Final score |
| Bet outcome | Win/loss |
| Model note | Why it was right/wrong |
| Skill update | What changed |

Do not only review hit/miss. Review whether the model understood the **script**.

---

## Recent Lessons Added to V5.1

### Ghana 1-0 Panama

Correct lessons:

- Ghana win was value when external market priced Ghana at 2.44.
- Chinese Sports Lottery at 2.04 was still positive EV but much less attractive.
- Qualification quality and athletic edge mattered more than public fear around missing players.
- The match confirmed the “Ghana small win” script.

Skill update:

> When a team remains structurally stronger despite absences, do not overreact to missing stars.

---

### Portugal 1-1 DR Congo

Correct lessons:

- Portugal low-odds win was overpriced.
- DR Congo resistance was real.
- Portugal -2 or big-cover angles were dangerous.
- Underdog qualification path and transition outlet mattered.

Skill update:

> High-talent favorite with real underdog resistance should not be treated as automatic cover.

---

### England 4-2 Croatia

Correct lessons:

- Croatia resistance was overrated relative to England’s Kill Index.
- Tournament experience matters, but cannot fully offset direct attacking quality.
- If a favorite has multiple routes to goal, draw-heavy projection should be reduced.

Skill update:

> Tournament Resistance must be capped when the favorite has high Kill Index and multiple attacking solutions.

---

## Output Format for Future Predictions

Use this structure:

```markdown
## Match: Team A vs Team B

### V5.1 Classification
Type: A/B/C/D

### Main Script
Short description of how the match likely plays out.

### Probability
| Result | Probability |
|---|---:|
| Team A win | xx% |
| Draw | xx% |
| Team B win | xx% |

### Top Scores
1. x-y
2. x-y
3. x-y

### Betting Value
| Bet | Odds | Model Probability | EV | Single/Parlay |
|---|---:|---:|---:|---|
| ... | ... | ... | ... | ... |

### Recommendation
- Main bet:
- Small bet:
- Avoid:
```

---

## Core Rules Summary

1. Price matters more than confidence.
2. Do not buy low-odds favorites unless probability truly exceeds breakeven.
3. Always check actual Chinese Sports Lottery handicap.
4. Never infer handicap from final score.
5. Qualification quality is a first-class input.
6. Strong team only covers if Kill Index beats Resistance.
7. Underdog value requires both resistance and price.
8. Avoid correlated overexposure.
9. Correct scores are small-stake only.
10. Review scripts, not just outcomes.
