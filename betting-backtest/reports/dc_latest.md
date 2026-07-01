# Ridge Dixon-Coles backtest — results through 2026-07-01

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 76
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.692   (log-goals; hosts only)
Baseline μ0 ............. +0.184   →  1.20 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.191   vs uniform 0.234   (skill +18.3%)
Brier    0.582   vs uniform 0.667   (skill +12.6%)
LogLoss  0.989   vs uniform 1.099
Top-pick accuracy ....... 59.2%   (decisive only 76.8%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     42       13%       12%      -2%
  20-40%    125       29%       25%      -5%
  40-60%     44       48%       66%     +17%
  60-80%     13       67%       77%     +10%
  80-100%     4       88%       25%     -63%
  ECE: 7.9%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.381   rps 0.213  
  k=0.5    logloss 1.225   rps 0.203  
  k=1.0    logloss 1.100   rps 0.195  
  k=2.0    logloss 1.021   rps 0.190  
  k=4.0    logloss 0.989   rps 0.191 *
  k=8.0    logloss 0.994   rps 0.197  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    Argentina              net +0.79  (att +0.28, def +0.51)
    Brazil                 net +0.73  (att +0.39, def +0.34)
    France                 net +0.61  (att +0.35, def +0.26)
    Portugal               net +0.59  (att +0.42, def +0.18)
    Spain                  net +0.57  (att +0.26, def +0.31)
  Weakest:
    Panama                 net -0.65  (att -0.55, def -0.10)
    Iraq                   net -0.80  (att -0.39, def -0.41)
    Curaçao                net -0.82  (att -0.30, def -0.52)
    Tunisia                net -0.90  (att -0.25, def -0.65)
    Uzbekistan             net -0.90  (att -0.30, def -0.60)
```
