#!/usr/bin/env bash
#
# Nightly Dixon-Coles refit + backtest report, in one reproducible command.
#
#   1. export tonight's recorded scores from the seed → betting-backtest/data/matches.csv
#   2. refit the ridge-DC model, run the leave-one-out backtest, and write
#      betting-backtest/reports/dc_latest.{md,json} + data/predictions.csv
#
# Usage:  bash betting-backtest/run_nightly.sh        (run from the repo root)
# Requires: node + npx (tsx) and python3 (standard library only).

set -euo pipefail

# Resolve the repo root from this script's location so it runs from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ 1/2  Exporting recorded results → betting-backtest/data/matches.csv"
npx tsx scripts/export-results-csv.ts betting-backtest/data

echo "▶ 2/2  Refitting ridge Dixon-Coles + leave-one-out backtest"
python3 betting-backtest/dc_model.py betting-backtest/data

echo "✓ Done. Report: betting-backtest/reports/dc_latest.md"
