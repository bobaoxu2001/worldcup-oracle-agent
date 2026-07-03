# Ridge Dixon-Coles backtest — results through 2026-07-03

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 82
Teams ................... 48
Ridge k (LOO-tuned) ..... 4.000
Home advantage (γ) ...... +0.634   (log-goals; hosts only)
Baseline μ0 ............. +0.225   →  1.25 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.187   vs uniform 0.233   (skill +19.8%)
Brier    0.573   vs uniform 0.667   (skill +14.0%)
LogLoss  0.972   vs uniform 1.099
Top-pick accuracy ....... 57.3%   (decisive only 76.7%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     47       13%       11%      -3%
  20-40%    130       29%       26%      -3%
  40-60%     49       49%       61%     +12%
  60-80%     16       68%       69%      +1%
  80-100%     4       89%       50%     -39%
  ECE: 5.0%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.293   rps 0.215  
  k=0.5    logloss 1.169   rps 0.204  
  k=1.0    logloss 1.068   rps 0.193  
  k=2.0    logloss 1.000   rps 0.187  
  k=4.0    logloss 0.972   rps 0.187 *
  k=8.0    logloss 0.978   rps 0.192  

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +0.92  (att +0.47, def +0.46)
    Brazil                 net +0.72  (att +0.36, def +0.35)
    Argentina              net +0.71  (att +0.30, def +0.41)
    Spain                  net +0.64  (att +0.15, def +0.49)
    Mexico                 net +0.53  (att -0.05, def +0.58)
  Weakest:
    Qatar                  net -0.65  (att -0.19, def -0.46)
    Curaçao                net -0.86  (att -0.33, def -0.53)
    Uzbekistan             net -0.88  (att -0.14, def -0.74)
    Iraq                   net -0.94  (att -0.40, def -0.53)
    Tunisia                net -0.94  (att -0.27, def -0.67)
```
