# Ridge Dixon-Coles backtest — results through 2026-07-23

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 104
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.483   (log-goals; hosts only)
Baseline μ0 ............. +0.246   →  1.28 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.191   vs uniform 0.239   (skill +20.3%)
Brier    0.562   vs uniform 0.667   (skill +15.7%)
LogLoss  0.946   vs uniform 1.099
Top-pick accuracy ....... 55.8%   (decisive only 68.8%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     61       14%       11%      -2%
  20-40%    174       30%       29%      -1%
  40-60%     48       49%       54%      +5%
  60-80%     26       67%       73%      +6%
  80-100%     3       89%       67%     -23%
  ECE: 2.4%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.103   rps 0.202  
  k=0.5    logloss 1.043   rps 0.197  
  k=1.0    logloss 0.989   rps 0.192  
  k=2.0    logloss 0.954   rps 0.190  
  k=4.0    logloss 0.946   rps 0.191 *
  k=8.0    logloss 0.963   rps 0.197  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    Spain                  net +1.30  (att +0.31, def +0.99)
    Argentina              net +0.79  (att +0.50, def +0.30)
    France                 net +0.73  (att +0.54, def +0.18)
    England                net +0.71  (att +0.68, def +0.03)
    Belgium                net +0.66  (att +0.45, def +0.22)
  Weakest:
    Qatar                  net -0.80  (att -0.24, def -0.56)
    Uzbekistan             net -0.86  (att -0.11, def -0.75)
    Curaçao                net -0.87  (att -0.34, def -0.53)
    Iraq                   net -0.92  (att -0.41, def -0.51)
    Tunisia                net -0.94  (att -0.28, def -0.66)
```
