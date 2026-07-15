# Ridge Dixon-Coles backtest — results through 2026-07-15

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 101
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.503   (log-goals; hosts only)
Baseline μ0 ............. +0.238   →  1.27 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.188   vs uniform 0.238   (skill +21.1%)
Brier    0.560   vs uniform 0.667   (skill +16.0%)
LogLoss  0.943   vs uniform 1.099
Top-pick accuracy ....... 59.4%   (decisive only 72.7%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     61       14%       13%      -1%
  20-40%    168       30%       27%      -2%
  40-60%     45       50%       60%     +10%
  60-80%     25       67%       68%      +1%
  80-100%     4       87%       75%     -12%
  ECE: 3.3%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.100   rps 0.199  
  k=0.5    logloss 1.036   rps 0.194  
  k=1.0    logloss 0.982   rps 0.189  
  k=2.0    logloss 0.949   rps 0.186  
  k=4.0    logloss 0.943   rps 0.188 *
  k=8.0    logloss 0.962   rps 0.195  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    Spain                  net +1.23  (att +0.37, def +0.86)
    France                 net +0.97  (att +0.42, def +0.55)
    Argentina              net +0.74  (att +0.57, def +0.17)
    Belgium                net +0.67  (att +0.44, def +0.22)
    England                net +0.66  (att +0.46, def +0.20)
  Weakest:
    Qatar                  net -0.79  (att -0.23, def -0.56)
    Curaçao                net -0.87  (att -0.34, def -0.53)
    Uzbekistan             net -0.87  (att -0.11, def -0.76)
    Iraq                   net -0.91  (att -0.38, def -0.53)
    Tunisia                net -0.94  (att -0.28, def -0.66)
```
