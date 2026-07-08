# Ridge Dixon-Coles backtest — results through 2026-07-08

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 93
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.565   (log-goals; hosts only)
Baseline μ0 ............. +0.230   →  1.26 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.187   vs uniform 0.237   (skill +21.1%)
Brier    0.562   vs uniform 0.667   (skill +15.7%)
LogLoss  0.954   vs uniform 1.099
Top-pick accuracy ....... 60.2%   (decisive only 74.3%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     56       14%       11%      -3%
  20-40%    152       30%       27%      -3%
  40-60%     45       49%       62%     +13%
  60-80%     22       67%       73%      +6%
  80-100%     4       89%       50%     -39%
  ECE: 5.1%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.187   rps 0.209  
  k=0.5    logloss 1.100   rps 0.200  
  k=1.0    logloss 1.024   rps 0.191  
  k=2.0    logloss 0.973   rps 0.186  
  k=4.0    logloss 0.954   rps 0.187 *
  k=8.0    logloss 0.967   rps 0.193  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +1.01  (att +0.45, def +0.56)
    Spain                  net +0.98  (att +0.23, def +0.75)
    Morocco                net +0.67  (att +0.32, def +0.34)
    England                net +0.62  (att +0.48, def +0.14)
    Brazil                 net +0.61  (att +0.31, def +0.31)
  Weakest:
    Qatar                  net -0.73  (att -0.21, def -0.52)
    Curaçao                net -0.86  (att -0.33, def -0.53)
    Uzbekistan             net -0.87  (att -0.12, def -0.75)
    Iraq                   net -0.90  (att -0.38, def -0.51)
    Tunisia                net -0.93  (att -0.27, def -0.66)
```
