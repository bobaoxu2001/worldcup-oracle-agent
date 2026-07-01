# Ridge Dixon-Coles backtest — results through 2026-07-01

_Auto-generated nightly by `dc_model.py`. Do not edit by hand._

```
======================================================================
  RIDGE DIXON-COLES — fit + leave-one-out backtest
======================================================================
Matches fit on .......... 79
Teams ................... 48
Ridge k (LOO-tuned) ..... 8.000
Home advantage (γ) ...... +0.605   (log-goals; hosts only)
Baseline μ0 ............. +0.277   →  1.32 goals/side neutral
Dixon-Coles ρ ........... -0.180   (low-score dependence)

-- LEAVE-ONE-OUT METRICS (out-of-sample) ---------------------------
RPS      0.195   vs uniform 0.231   (skill +15.9%)
Brier    0.591   vs uniform 0.667   (skill +11.4%)
LogLoss  0.992   vs uniform 1.099
Top-pick accuracy ....... 55.7%   (decisive only 75.4%)

-- CALIBRATION (pooled LOO 1X2 outcomes) ---------------------------
  bucket      n   mean_pred  observed   gap
  00-20%     25       14%       20%      +6%
  20-40%    155       29%       25%      -5%
  40-60%     47       48%       64%     +16%
  60-80%     10       71%       60%     -11%
  ECE: 7.4%

-- RIDGE TUNING (LOO log-loss by k) --------------------------------
  k=0.25   logloss 1.380   rps 0.223  
  k=0.5    logloss 1.233   rps 0.211  
  k=1.0    logloss 1.112   rps 0.200  
  k=2.0    logloss 1.031   rps 0.193  
  k=4.0    logloss 0.993   rps 0.191  
  k=8.0    logloss 0.992   rps 0.195 *

-- TEAM STRENGTH (net = attack + defence, full-data fit) -----------
  (att ↑ = scores more · def ↑ = concedes less)
  Strongest:
    France                 net +0.69  (att +0.39, def +0.30)
    Brazil                 net +0.50  (att +0.25, def +0.25)
    Argentina              net +0.50  (att +0.23, def +0.27)
    Spain                  net +0.41  (att +0.10, def +0.32)
    Portugal               net +0.36  (att +0.14, def +0.22)
  Weakest:
    Qatar                  net -0.47  (att -0.14, def -0.33)
    Curaçao                net -0.60  (att -0.22, def -0.38)
    Uzbekistan             net -0.64  (att -0.12, def -0.52)
    Tunisia                net -0.69  (att -0.18, def -0.51)
    Iraq                   net -0.70  (att -0.26, def -0.44)
```
