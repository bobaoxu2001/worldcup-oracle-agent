/**
 * Tests for the cost-aware LLM provider router.
 *
 * Run with:  npm run test:routing
 *
 * Verifies the PURE routing decisions (no network calls): DeepSeek is the
 * low-cost default, Gemini is the premium escalation for complex/ambiguous
 * queries, and the chain degrades to deterministic when no key is present.
 * These tests never touch probabilities, rules, or simulations — only which
 * LLM (if any) would write the prose.
 *
 * Exits with code 1 if any assertion fails.
 */

import assert from "node:assert";
import { assessComplexity, selectLLMProvider } from "@/lib/llm/provider";

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, `FAILED: ${name}`);
  console.log(`  ✓ ${name}`);
  passed++;
}

// Helpers to simulate which keys are configured (read live by the router).
function setKeys({ deepseek, gemini }: { deepseek: boolean; gemini: boolean }) {
  if (deepseek) {
    process.env.DEEPSEEK_API_KEY = "x".repeat(20);
    process.env.AI_PROVIDER = "deepseek";
  } else {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.AI_PROVIDER;
  }
  if (gemini) process.env.GOOGLE_API_KEY = "x".repeat(20);
  else delete process.env.GOOGLE_API_KEY;
}

console.log("complexity heuristic:");
check("simple English champion is NOT complex", assessComplexity("Who will win the champion?") === false);
check("simple Chinese champion is NOT complex", assessComplexity("谁会赢得世界杯冠军？") === false);
check("team comparison (2 teams) is NOT complex", assessComplexity("Compare Argentina and France", { teamCount: 2, intent: "team-comparison" }) === false);
check("path-analysis intent IS complex", assessComplexity("Argentina's road", { intent: "path-analysis" }) === true);
check("group-qualification intent IS complex", assessComplexity("Group A?", { intent: "group-qualification" }) === true);
check("best third-place wording IS complex", assessComplexity("How do best third-place teams advance and who benefits?") === true);
check("path-to-final wording IS complex", assessComplexity("What is Brazil's path to the final?") === true);
check(">2 teams IS complex", assessComplexity("Argentina vs France vs Spain", { teamCount: 3 }) === true);
check("low confidence IS complex", assessComplexity("hmm", { confidence: 20 }) === true);
check("rules + prediction combined IS complex", assessComplexity("Given the tie-break rules, who wins the group and advances?") === true);
check("team comparison with low win-prob confidence is NOT complex", assessComplexity("Compare Argentina and France", { intent: "team-comparison", teamCount: 2, confidence: 39 }) === false);

console.log("provider selection — both keys present:");
setKeys({ deepseek: true, gemini: true });
check("simple English champion → deepseek", selectLLMProvider({ query: "Who will win the champion?", intent: "champion-odds" }) === "deepseek");
check("simple Chinese champion → deepseek", selectLLMProvider({ query: "谁会赢得世界杯冠军？", intent: "champion-odds", language: "zh-CN" }) === "deepseek");
check("team comparison → deepseek", selectLLMProvider({ query: "Compare Argentina and France", intent: "team-comparison", teamCount: 2 }) === "deepseek");
check("path-to-final → gemini", selectLLMProvider({ query: "Brazil's path to the final?", intent: "path-analysis" }) === "gemini");
check("group qualification → gemini", selectLLMProvider({ query: "Who qualifies from Group A?", intent: "group-qualification" }) === "gemini");
check("best third-place complex → gemini", selectLLMProvider({ query: "How do best third-place teams advance?", intent: "rules-explanation" }) === "gemini");

console.log("provider selection — Gemini key missing (DeepSeek only):");
setKeys({ deepseek: true, gemini: false });
check("complex query falls back to deepseek", selectLLMProvider({ query: "Brazil's path to the final?", intent: "path-analysis" }) === "deepseek");
check("simple query → deepseek", selectLLMProvider({ query: "Who will win the champion?" }) === "deepseek");

console.log("provider selection — DeepSeek key missing (Gemini only):");
setKeys({ deepseek: false, gemini: true });
check("simple query → gemini (only provider)", selectLLMProvider({ query: "Who will win the champion?" }) === "gemini");
check("complex query → gemini", selectLLMProvider({ query: "Brazil's path to the final?", intent: "path-analysis" }) === "gemini");

console.log("provider selection — no keys:");
setKeys({ deepseek: false, gemini: false });
check("simple query → none (deterministic)", selectLLMProvider({ query: "Who will win the champion?" }) === "none");
check("complex query → none (deterministic)", selectLLMProvider({ query: "Brazil's path to the final?", intent: "path-analysis" }) === "none");

console.log(`\nAll ${passed} routing checks passed.`);
