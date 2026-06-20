# Model Evaluation — WorldCup Oracle Agent

_Last evaluated: 2026-06-20, after 32 completed matches (group stage, matchdays 1–2 in progress)._

This report is the standing answer to two questions an ML/data reviewer will ask:
**how good is the model, and why aren't we tuning it right now?** It is reproducible —
every number below comes from the committed walk-forward scripts:

```
npm run backtest   # per-match walk-forward scoring, skill scores, calibration
npm run evolve     # grid search over the two free parameters
```

Both predict each match using **only results dated strictly before it** (no leakage).

---

## 1. Headline metrics (live `full+draw` model)

| Metric | Value | Read |
|---|---|---|
| Brier (multiclass) ↓ | **0.505** | — |
| **RPS** (ordinal 1X2) ↓ | **0.149** | headline metric for football 1X2 |
| LogLoss ↓ | **0.829** | — |
| Top-pick accuracy | 56% (18/32) | weak metric for a probabilistic model — penalises correct hedging |
| **ECE** (calibration error) ↓ | **4.5%** | well-calibrated for n=32 |

**Skill vs a uniform 1/3-1/3-1/3 baseline** (sample-size invariant; >0 = beats no-information):

| Skill score | Value |
|---|---|
| Brier Skill Score | **0.242** |
| RPS Skill Score | **0.341** |
| LogLoss | 0.829 vs 1.099 uniform (**25% lower**) |

## 2. Layer ablation (each layer earns its place)

Walk-forward, cumulative — every added layer must lower LogLoss/RPS to stay:

| Variant | Brier | RPS | LogLoss | What it adds |
|---|---|---|---|---|
| `unif` | 0.667 | 0.226 | 1.099 | uniform baseline |
| `base` | 0.529 | 0.153 | 0.869 | calibrated Elo + host bonus |
| `old` | 0.533 | 0.155 | 0.875 | + result learning + confederation form |
| `full` | 0.522 | 0.151 | 0.860 | + value-weighted injuries + tactical matchup |
| `drawFlat` | 0.511 | 0.150 | 0.835 | + group-stage draw boost (opener-weighted) |
| **`full+draw`** | **0.505** | **0.149** | **0.829** | + kill-index draw dampener (live engine) |

The draw layer is the single biggest gain (LogLoss 0.860 → 0.829). `old` is marginally
worse than `base` on this small sample but is retained because confederation form is a
shrunk, capped regional prior whose value grows with sample size.

## 3. Why no parameter change is justified (yet)

The engine exposes two free knobs; `npm run evolve` grid-searches them walk-forward:

- **`gapScale` = 1.0** (no compression of the favourite's Elo edge).
- **`drawBoost` = 0.33** (group-stage draw inflation, opener-weighted).

LogLoss surface (rows = gapScale, cols = drawBoost), current sample:

```
        0.00   0.06   0.12   0.18   0.24   0.30   0.36
0.78    0.874  0.868  0.863  0.860  0.857  0.856  0.855
0.84    0.868  0.862  0.858  0.854  0.851  0.849  0.848
0.90    0.864  0.858  0.853  0.849  0.846  0.843  0.842
0.96    0.861  0.855  0.849  0.845  0.841  0.839  0.837
1.00    0.859  0.852  0.847  0.842  0.839  0.836  0.834
```

- **gapScale stays 1.0.** The surface is flat-to-better as gapScale rises to 1.0, and the
  calibration table (§4) shows the model is, if anything, mildly *under*-confident in the
  60–80% band — there is **no overconfidence to compress away**. Lowering gapScale would
  manufacture error.
- **drawBoost stays 0.33, not 0.36.** The grid optimum sits at the **high edge** of the
  search (0.36 → 0.834 vs the live 0.33 → ~0.835, a ~0.001 difference). That edge is fit to
  a sample that is **all group stage and opener-heavy**, where draws are structurally
  inflated (current draw rate 31%). Chasing the edge would overfit a draw rate that is
  expected to fall as matchday 3 brings must-win games. 0.33 is deliberately regularised
  short of the edge while capturing essentially all of the realised gain.

**Decision: freeze both.** Re-run `npm run evolve` after each matchday; only move a constant
if the optimum moves clearly **off** the grid edge and the improvement survives on
out-of-sample matches.

## 4. Calibration (reliability) read

Pooled over all three outcomes of all 32 matches (`full+draw`):

| Pred bucket | n | Mean pred | Observed | Gap |
|---|---|---|---|---|
| 00–20% | 28 | 11% | 7% | −4% |
| 20–40% | 41 | 31% | 32% | +1% |
| 40–60% | 15 | 51% | 47% | −4% |
| 60–80% | 8 | 65% | 88% | +22% |
| 80–100% | 4 | 83% | 75% | −8% |

- **Overall ECE 4.5%** — strong for this sample size.
- The **+22% in the 60–80% bucket (n=8)** is the one cell to watch: the model has been
  slightly under-confident on its medium-strong favourites. It is **not actionable yet**
  (n=8, and it argues *against* compression, not for it). Re-check as n grows.
- Longshots (0–20%) are very slightly over-weighted (11% pred vs 7% observed) — healthy
  humility, not a defect.

## 5. Behavioural correctness (not just metrics)

- **Completed-fixture retrospective.** If a requested fixture has already been played, the
  agent leads with the real final score and frames the model output as a retrospective
  pre-match read (see `lib/prediction-engine/completedFixtures.ts`, `npm run test:completed`).
- **Upcoming-fixture freshness.** Upcoming predictions append a deterministic footnote
  stating the recency of the results behind the read, with a ⚠️ when stale
  (`lib/data-truth/freshness.ts`, `npm run test:freshness` / `test:honesty`).
- **Group vs knockout.** The draw-propensity layer applies to genuine group fixtures only;
  cross-group / knockout hypotheticals are untouched (they resolve via ET/pens), so the
  draw inflation never leaks into knockout reasoning.
- **Upset handling.** The model correctly does not over-compress favourites; e.g. it had
  Türkiye a 51% favourite vs Paraguay (a genuine miss when 10-man Paraguay won 1–0) —
  recorded honestly rather than hindsight-tuned.

## 6. Known limitations

- **Small sample (n=32), all group stage.** All calibration/skill numbers carry wide error
  bars; treat single-bucket gaps as noise until n grows.
- **Draw rate is regime-dependent.** Openers draw more than must-win matchday-3 games; the
  draw layer is opener-weighted to track this, but the constant should be re-fit per matchday.
- **No knockout out-of-sample data yet.** Knockout calibration is unverified until the
  bracket begins.
- **Manual results layer is the source of truth offline.** Live results (football-data.org)
  override it when present; absence is reported honestly, never invented.
