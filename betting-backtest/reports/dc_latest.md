# Ridge Dixon-Coles backtest — results through 2026-07-06

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 87
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.645   (log-goals; hosts only)
Baseline μ0 ............. +0.226   →  1.25 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.182   vs uniform 0.236   (skill +22.9%)
Brier    0.558   vs uniform 0.667   (skill +16.4%)
LogLoss  0.947   vs uniform 1.099
Top-pick accuracy ....... 57.5%   (decisive only 75.4%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     55       14%        9%      -5%
  20-40%    137       29%       27%      -2%
  40-60%     45       49%       62%     +13%
  60-80%     20       67%       75%      +8%
  80-100%     4       89%       50%     -39%
  ECE: 5.6%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.192   rps 0.202  
  k=0.5    logloss 1.098   rps 0.193  
  k=1.0    logloss 1.019   rps 0.185  
  k=2.0    logloss 0.966   rps 0.181  
  k=4.0    logloss 0.947   rps 0.182 *
  k=8.0    logloss 0.959   rps 0.188  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +0.92  (att +0.47, def +0.46)
    Spain                  net +0.86  (att +0.24, def +0.62)
    Brazil                 net +0.72  (att +0.36, def +0.35)
    Argentina              net +0.61  (att +0.38, def +0.22)
    Switzerland            net +0.59  (att +0.28, def +0.31)
  Weakest:
    Qatar                  net -0.63  (att -0.17, def -0.46)
    Uzbekistan             net -0.85  (att -0.12, def -0.73)
    Curaçao                net -0.86  (att -0.33, def -0.53)
    Iraq                   net -0.94  (att -0.40, def -0.53)
    Tunisia                net -0.94  (att -0.27, def -0.67)
```
