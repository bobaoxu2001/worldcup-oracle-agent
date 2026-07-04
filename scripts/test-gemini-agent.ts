/**
 * Offline tests for the Gemini function-calling agent loop
 * (lib/llm/geminiAgent.ts). No network, no API key, no cost: a scripted fake
 * transport plays the role of Gemini so we can assert the loop's mechanics —
 * it executes the tools the "model" asks for, feeds their deterministic results
 * back, records a trace, settles on the text answer, and fails soft.
 *
 * Run: npm run test:gemini-agent
 */

import {
  runGeminiAgent,
  type GeminiTransport,
  type GeminiResponse,
  type GeminiRequest,
} from "../lib/llm/geminiAgent";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const text = (t: string): GeminiResponse => ({ candidates: [{ content: { parts: [{ text: t }] } }] });
const calls = (cs: { name: string; args: Record<string, unknown> }[]): GeminiResponse => ({
  candidates: [{ content: { parts: cs.map((c) => ({ functionCall: { name: c.name, args: c.args } })) } }],
});

async function main() {
// ── 1. A realistic multi-round tool-use conversation ─────────────────────────
{
  // Round 1: resolve both casually-named teams.
  // Round 2: check tournament state + pull news for one side.
  // Round 3: run the deterministic prediction.
  // Round 4: settle on a text answer.
  const script: GeminiResponse[] = [
    calls([
      { name: "resolve_team", args: { name: "the USA" } },
      { name: "resolve_team", args: { name: "Argentina" } },
    ]),
    calls([
      { name: "get_tournament_state", args: {} },
      { name: "get_team_news", args: { team: "argentina", limit: 3 } },
    ]),
    calls([{ name: "predict_match", args: { teamA: "united-states", teamB: "argentina" } }]),
    text("Argentina are clear favourites over the USA on the model's numbers, with the draw a distant third."),
  ];
  let i = 0;
  const seen: GeminiRequest[] = [];
  const transport: GeminiTransport = async (req) => {
    seen.push(req);
    return script[Math.min(i++, script.length - 1)];
  };

  const result = await runGeminiAgent("Will the USA beat Argentina?", { transport, maxRounds: 6 });
  check("loop returns a result", result !== null);
  if (result) {
    check("settles on the model's text answer", result.text.includes("Argentina"));
    check("took 4 rounds (3 tool rounds + 1 text)", result.rounds === 4, `rounds=${result.rounds}`);
    const names = result.toolCalls.map((t) => t.name);
    check(
      "executed every tool the model asked for, in order",
      JSON.stringify(names) ===
        JSON.stringify(["resolve_team", "resolve_team", "get_tournament_state", "get_team_news", "predict_match"]),
      names.join(",")
    );
    // The numbers must come from the deterministic engine, surfaced in the trace.
    const predictTrace = result.toolCalls.find((t) => t.name === "predict_match");
    check("predict_match trace carries engine probabilities", !!predictTrace && /\d+%/.test(predictTrace.resultSummary), predictTrace?.resultSummary);
    check(
      "resolve_team mapped 'the USA' to United States",
      result.toolCalls[0].resultSummary.toLowerCase().includes("united states"),
      result.toolCalls[0].resultSummary
    );
  }
  // The transport must have received the tool declarations and system instruction.
  const firstReq = seen[0];
  check("request advertises the tool declarations to the model", (firstReq?.tools?.[0]?.functionDeclarations?.length ?? 0) >= 4);
  check("request carries the system instruction", /never invent/i.test(firstReq?.systemInstruction?.parts?.[0]?.text ?? ""));
  // Gemini's protocol requires the functionCall + functionResponse turns to be
  // appended to the transcript. By the final request the transcript must contain
  // both a "model" (functionCall) and a "function" (functionResponse) turn.
  const lastReq = seen[seen.length - 1];
  const roles = lastReq.contents.map((c: { role: string }) => c.role);
  check("transcript grows with model + function turns", roles.includes("model") && roles.includes("function"), roles.join(","));
}

// ── 2. Deterministic engine actually drives predict_match numbers ────────────
{
  // Force the model to call predict_match on a lopsided fixture and confirm the
  // favourite in the trace matches the deterministic engine (Brazil ≫ Qatar).
  const script: GeminiResponse[] = [
    calls([{ name: "predict_match", args: { teamA: "brazil", teamB: "qatar" } }]),
    text("Brazil are overwhelming favourites."),
  ];
  let i = 0;
  const transport: GeminiTransport = async () => script[Math.min(i++, script.length - 1)];
  const result = await runGeminiAgent("Brazil vs Qatar?", { transport });
  const trace = result?.toolCalls.find((t) => t.name === "predict_match");
  // Summary format: "Brazil 78% · draw 14% · Qatar 8%". Brazil's % must exceed Qatar's.
  const m = trace?.resultSummary.match(/Brazil (\d+)%.*Qatar (\d+)%/);
  check("engine makes Brazil the favourite over Qatar", !!m && Number(m[1]) > Number(m[2]), trace?.resultSummary);
}

// ── 3. Fail-soft: no key + no transport → null (caller uses deterministic) ───
{
  const prev = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, GOOGLE_API_KEY: process.env.GOOGLE_API_KEY };
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  const result = await runGeminiAgent("Who wins the World Cup?");
  check("returns null when no key and no injected transport", result === null);
  if (prev.GEMINI_API_KEY) process.env.GEMINI_API_KEY = prev.GEMINI_API_KEY;
  if (prev.GOOGLE_API_KEY) process.env.GOOGLE_API_KEY = prev.GOOGLE_API_KEY;
}

// ── 4. Fail-soft: a throwing transport is swallowed → null ───────────────────
{
  const transport: GeminiTransport = async () => {
    throw new Error("simulated network failure");
  };
  const result = await runGeminiAgent("Argentina vs France?", { transport });
  check("returns null when the transport throws", result === null);
}

// ── 5. Fail-soft: model never settles within maxRounds → null ────────────────
{
  // Always ask for a tool, never emit text.
  const transport: GeminiTransport = async () => calls([{ name: "get_tournament_state", args: {} }]);
  const result = await runGeminiAgent("loop forever?", { transport, maxRounds: 3 });
  check("returns null if the model never settles on an answer", result === null);
}

// ── 6. Empty candidate (safety block) → null, not a crash ────────────────────
{
  const transport: GeminiTransport = async () => ({ candidates: [] });
  const result = await runGeminiAgent("anything", { transport });
  check("handles an empty candidate list without throwing", result === null);
}
}

main().then(() => {
  console.log(`\n${failed === 0 ? "✅" : "❌"} Gemini-agent checks: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
});
