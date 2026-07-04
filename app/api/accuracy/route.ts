import { NextResponse } from "next/server";
import { computeTrackRecord } from "@/lib/prediction-engine/trackRecord";
import { loadDcReport } from "@/lib/prediction-engine/dcReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/accuracy
 * The agent's verified out-of-sample track record: a walk-forward backtest of
 * the LIVE prediction stack against every completed 2026 World Cup result, plus
 * the independent ridge Dixon-Coles LOO cross-check. Deterministic; never
 * touches the network or the database, so it always succeeds.
 */
export async function GET() {
  const track = computeTrackRecord();
  const dc = loadDcReport();
  return NextResponse.json(
    { track, dc },
    { headers: { "Cache-Control": "no-store" } }
  );
}
