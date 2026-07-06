# Ridge Dixon-Coles backtest — results through 2026-07-06

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 86
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.641   (log-goals; hosts only)
Baseline μ0 ............. +0.230   →  1.26 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.182   vs uniform 0.235   (skill +22.6%)
Brier    0.559   vs uniform 0.667   (skill +16.2%)
LogLoss  0.949   vs uniform 1.099
Top-pick accuracy ....... 59.3%   (decisive only 78.1%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     55       14%        9%      -5%
  20-40%    133       29%       27%      -2%
  40-60%     46       49%       61%     +12%
  60-80%     20       67%       75%      +8%
  80-100%     4       89%       50%     -39%
  ECE: 5.3%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.202   rps 0.204  
  k=0.5    logloss 1.104   rps 0.194  
  k=1.0    logloss 1.023   rps 0.186  
  k=2.0    logloss 0.968   rps 0.181  
  k=4.0    logloss 0.949   rps 0.182 *
  k=8.0    logloss 0.961   rps 0.188  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +0.92  (att +0.46, def +0.46)
    Spain                  net +0.86  (att +0.24, def +0.63)
    Brazil                 net +0.72  (att +0.36, def +0.35)
    Argentina              net +0.61  (att +0.38, def +0.22)
    Switzerland            net +0.59  (att +0.28, def +0.31)
  Weakest:
    Qatar                  net -0.63  (att -0.17, def -0.46)
    Curaçao                net -0.86  (att -0.33, def -0.53)
    Uzbekistan             net -0.87  (att -0.14, def -0.73)
    Iraq                   net -0.94  (att -0.40, def -0.53)
    Tunisia                net -0.94  (att -0.27, def -0.67)
```
