# Ridge Dixon-Coles backtest — results through 2026-07-12

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 97
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.518   (log-goals; hosts only)
Baseline μ0 ............. +0.234   →  1.26 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.187   vs uniform 0.237   (skill +20.9%)
Brier    0.563   vs uniform 0.667   (skill +15.6%)
LogLoss  0.947   vs uniform 1.099
Top-pick accuracy ....... 58.8%   (decisive only 72.6%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     57       14%       11%      -3%
  20-40%    163       30%       28%      -2%
  40-60%     43       50%       60%     +11%
  60-80%     25       67%       72%      +5%
  80-100%     3       90%       67%     -23%
  ECE: 4.0%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.141   rps 0.205  
  k=0.5    logloss 1.063   rps 0.197  
  k=1.0    logloss 0.998   rps 0.190  
  k=2.0    logloss 0.957   rps 0.186  
  k=4.0    logloss 0.947   rps 0.187 *
  k=8.0    logloss 0.965   rps 0.194  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +1.16  (att +0.49, def +0.67)
    Spain                  net +0.99  (att +0.23, def +0.76)
    Belgium                net +0.72  (att +0.43, def +0.28)
    England                net +0.61  (att +0.48, def +0.14)
    Argentina              net +0.61  (att +0.47, def +0.14)
  Weakest:
    Qatar                  net -0.76  (att -0.21, def -0.55)
    Iraq                   net -0.86  (att -0.37, def -0.49)
    Curaçao                net -0.86  (att -0.33, def -0.53)
    Uzbekistan             net -0.87  (att -0.11, def -0.76)
    Tunisia                net -0.93  (att -0.27, def -0.66)
```
