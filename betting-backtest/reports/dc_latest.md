# Ridge Dixon-Coles backtest — results through 2026-07-13

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 100
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.504   (log-goals; hosts only)
Baseline μ0 ............. +0.238   →  1.27 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.187   vs uniform 0.238   (skill +21.5%)
Brier    0.557   vs uniform 0.667   (skill +16.4%)
LogLoss  0.939   vs uniform 1.099
Top-pick accuracy ....... 59.0%   (decisive only 72.4%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     56       13%        9%      -4%
  20-40%    169       29%       28%      -2%
  40-60%     46       49%       59%      +9%
  60-80%     25       67%       72%      +5%
  80-100%     4       87%       75%     -12%
  ECE: 3.8%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.100   rps 0.200  
  k=0.5    logloss 1.034   rps 0.194  
  k=1.0    logloss 0.978   rps 0.188  
  k=2.0    logloss 0.945   rps 0.185  
  k=4.0    logloss 0.939   rps 0.187 *
  k=8.0    logloss 0.959   rps 0.194  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +1.15  (att +0.48, def +0.66)
    Spain                  net +1.04  (att +0.30, def +0.75)
    Argentina              net +0.73  (att +0.56, def +0.17)
    England                net +0.67  (att +0.46, def +0.21)
    Belgium                net +0.65  (att +0.44, def +0.22)
  Weakest:
    Qatar                  net -0.79  (att -0.23, def -0.56)
    Curaçao                net -0.86  (att -0.34, def -0.53)
    Iraq                   net -0.87  (att -0.37, def -0.51)
    Uzbekistan             net -0.87  (att -0.11, def -0.76)
    Tunisia                net -0.93  (att -0.27, def -0.66)
```
