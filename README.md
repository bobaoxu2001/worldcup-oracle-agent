# 🔮 WorldCup Oracle Agent

> **An AI agent that analyzes World Cup 2026 matchups, runs simulations, explains its predictions, and answers follow-up questions in real time.**

Built for the **Google Cloud Rapid Agent Hackathon** · targets the **MongoDB Partner Track**.

WorldCup Oracle Agent is **not** a static prediction dashboard. You ask a football question in plain English — *"Who will win Argentina vs Portugal?"* — and watch an agent **plan** the analysis, **resolve** the teams, **run 10,000 Monte Carlo simulations**, **explain** its reasoning, **remember** the result, and **answer your follow-ups** (*"What if Messi was unavailable?"*).

---

## What it does

1. **Understands** a natural-language football question.
2. **Plans** the right analysis (single match · what-if scenario · tournament winner · social preview).
3. **Resolves** the teams from casual names (`USA`, `Türkiye`, `the Netherlands`) → canonical profiles.
4. **Analyzes** team strength (Elo, host advantage, expected goals, draw likelihood).
5. **Simulates** the matchup **10,000 times** with a seeded Monte Carlo engine.
6. **Generates** a fan-friendly prediction report (probabilities, scoreline, confidence, upset risk).
7. **Explains** the reasoning in plain English — plus a punchy fan insight and an optional TikTok-style script.
8. **Remembers** every interaction in MongoDB (with a zero-config in-memory fallback).
9. **Answers follow-ups** by re-running the model under new conditions and showing what changed.

## Why it's an agent (not just an LLM call)

The product is built as an explicit **agent pipeline** — each stage is a real, inspectable function, and the agent's reasoning timeline is shown to the user as it works:

```
User Query
  → Agent Planner          classify intent, choose the plan        lib/agent/planner.ts
  → Match Data Resolver     free text → canonical team profiles     lib/agent/matchResolver.ts
  → Prediction Engine       Elo + Dixon-Coles closed-form 1X2       lib/prediction-engine/
  → Monte Carlo Simulator   10,000 seeded simulated matches         lib/agent/simulator.ts
  → Explanation Generator   plain-English + fan insight + TikTok     lib/agent/explanationGenerator.ts
  → MongoDB Memory          persist the interaction (fail-soft)      lib/db/mongodb.ts
  → Final Answer
```

The **numbers are 100% deterministic** (a ported, calibrated statistical model). The optional **Gemini** layer only restyles the prose — it never invents stats, and the app works identically without it. That combination — statistical rigor *plus* an agentic workflow with memory — is the whole point.

---

## Agent workflow (what the user sees)

After you ask a question, the agent shows a live **reasoning timeline**:

| Step | Status | Description |
|------|--------|-------------|
| 1 · Gather match data | ✅ Completed | Identified Argentina 🇦🇷 and Portugal 🇵🇹 and loaded their team profiles. |
| 2 · Analyze team strength | ✅ Completed | Compared Elo (2064 vs 1934), host advantage, expected goals and draw likelihood. |
| 3 · Run Monte Carlo simulation | ✅ Completed | Simulated the matchup 10,000 times. |
| 4 · Generate prediction report | ✅ Completed | Converted the simulation into a clear, fan-friendly prediction. |

…followed by a **prediction card**, a **simulation center** (scoreline distribution + averages), a plain-English **"Why?"**, a **fan insight**, and a **follow-up** rail.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** (App Router) · React 19 · TypeScript |
| Styling | **Tailwind CSS** · custom dark "stadium-night" theme · lucide-react icons |
| Prediction model | **Elo → Dixon-Coles bivariate Poisson → Monte Carlo** (ported to TS) |
| Agent pipeline | Plain, typed TypeScript functions (`lib/agent/*`) — easy for judges to read |
| Memory | **MongoDB** (`mongodb` driver) with automatic in-memory fallback |
| LLM (optional) | **Google Gemini** (`gemini-2.0-flash` via REST) — narrative polish only |
| Deploy | Vercel-ready (all external services degrade gracefully) |

### The prediction model

The statistical core is a TypeScript port of a calibrated World Cup model:

- **Elo ratings** for all 48 qualified nations (real 2026 final-draw field).
- **Dixon-Coles** bivariate Poisson goal model (ρ = −0.13) for closed-form 1X2 probabilities and a scoreline grid.
- **Monte Carlo**: a seeded PRNG (mulberry32) samples 10,000 matches per fixture for the simulation view, and a full 48-team tournament (groups → best thirds → knockouts) for title odds — memoised and reproducible.
- **Host advantage**: USA / Canada / Mexico carry a +75 Elo home bonus.

---

## MongoDB usage (Partner Track)

Every agent interaction is persisted as the agent's **memory**, powering the "Recent Predictions" rail.

**Schema** (`lib/db/mongodb.ts`):

```ts
{
  userQuery: string,
  intent: string,
  teams: string[],
  prediction: { teamAWin, draw, teamBWin, confidence } | null,
  simulationResult: { simulationsRun, mostLikelyScore, upsetProbability, summary } | null,
  reasoningSteps: string[],
  explanation: string,
  followUpContext: string,
  createdAt: Date
}
```

- `POST /api/agent/predict` → runs the agent and **saves** the interaction.
- `GET  /api/predictions/recent` → **fetches** recent predictions for the memory rail.

**Fail-soft guarantee:** if `MONGODB_URI` is missing, invalid, or unreachable, the app transparently uses an in-process memory store with a short connection timeout. **MongoDB errors never break the demo** — the UI even shows which backend served the data (`MongoDB` vs `In-memory`).

---

## Google Cloud / Gemini readiness

Gemini plugs into a single seam (`lib/llm/gemini.ts`). When `GOOGLE_API_KEY` is set, the agent asks Gemini to rewrite its deterministic explanation into livelier prose (numbers preserved exactly). When it's **not** set — the default for the demo — the built-in deterministic generator is used and everything works identically. A 6-second timeout means a slow API can never stall the demo.

The UI badges each answer as **`Gemini-enhanced`** or **`Deterministic engine`** so the seam is visible.

---

## Run it locally

```bash
git clone https://github.com/bobaoxu2001/worldcup-oracle-agent.git
cd worldcup-oracle-agent
npm install
npm run dev          # http://localhost:3000
```

**No `.env` needed.** With zero configuration the agent fully works: deterministic predictions + simulations + explanations, predictions persisted to in-memory storage.

### Environment variables (all optional)

Copy `.env.example` → `.env.local` and fill in only what you want:

| Variable | Purpose | If missing |
|----------|---------|------------|
| `MONGODB_URI` | Agent memory (MongoDB Partner Track) | Falls back to in-memory store |
| `MONGODB_DB` | Database name (default `worldcup_oracle`) | Uses default |
| `GOOGLE_API_KEY` | Gemini narrative polish | Uses deterministic generator |
| `NEXT_PUBLIC_APP_URL` | Absolute URL for metadata | Defaults to `localhost:3000` |

### Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## Demo prompts

Paste any of these into the agent:

- `Who will win Argentina vs Portugal?` — the flagship demo (always produces a great result)
- `Predict France vs Brazil`
- `Simulate USA vs Mexico`
- `Which team has the best chance to win the 2026 World Cup?` — runs the full-tournament Monte Carlo
- `Give me a TikTok-style match preview for England vs Germany`
- **Follow-up:** `What if Messi was unavailable?` — re-runs the prior matchup under the new scenario and explains what changed

---

## Hackathon relevance

WorldCup Oracle Agent transforms a traditional World Cup prediction model into an **AI agent** that can reason through football matchups, run simulations, generate fan-friendly predictions, and remember previous prediction sessions. It combines **statistical modeling** with a full **agent workflow** — planning, data resolution, simulation, reasoning, explanation, and memory — which is exactly what the Rapid Agent Hackathon (and the MongoDB Partner Track) reward.

## Future roadmap

- **Native Gemini function-calling** so the LLM drives the pipeline (planner → tools) instead of only narrating.
- **Live data ingestion** (injuries, form, lineups) as capped soft signals on top of Elo.
- **Multi-turn memory recall** — the agent cites its own past predictions in follow-ups.
- **Bracket builder** — simulate a user's custom knockout path.
- **Vector search over historical matches** (MongoDB Atlas Vector Search) for "find similar fixtures."

---

*Predictions are model estimates for entertainment & informational use only.*
