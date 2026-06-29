# Ridge Dixon-Coles backtest — results through 2026-06-29

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 72
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.699   (log-goals; hosts only)
Baseline μ0 ............. +0.199   →  1.22 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.195   vs uniform 0.236   (skill +17.4%)
Brier    0.584   vs uniform 0.667   (skill +12.3%)
LogLoss  0.993   vs uniform 1.099
Top-pick accuracy ....... 58.3%   (decisive only 75.9%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     38       13%       13%      +0%
  20-40%    118       29%       23%      -6%
  40-60%     44       48%       68%     +20%
  60-80%     12       67%       75%      +8%
  80-100%     4       89%       25%     -64%
  ECE: 9.0%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.418   rps 0.225  
  k=0.5    logloss 1.241   rps 0.214  
  k=1.0    logloss 1.108   rps 0.202  
  k=2.0    logloss 1.026   rps 0.195  
  k=4.0    logloss 0.993   rps 0.195 *
  k=8.0    logloss 0.998   rps 0.201  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    Argentina              net +0.79  (att +0.27, def +0.52)
    Brazil                 net +0.66  (att +0.32, def +0.35)
    France                 net +0.61  (att +0.34, def +0.27)
    Portugal               net +0.59  (att +0.41, def +0.18)
    Spain                  net +0.57  (att +0.26, def +0.31)
  Weakest:
    Panama                 net -0.65  (att -0.55, def -0.10)
    Curaçao                net -0.79  (att -0.30, def -0.48)
    Iraq                   net -0.80  (att -0.39, def -0.41)
    Tunisia                net -0.87  (att -0.25, def -0.63)
    Uzbekistan             net -0.90  (att -0.31, def -0.60)
```
