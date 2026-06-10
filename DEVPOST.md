# WorldCup Oracle Agent — Devpost

**Google Cloud Rapid Agent Hackathon · MongoDB Track**

| | |
|---|---|
| **🔗 Live demo** | **https://worldcup-oracle-agent.vercel.app** |
| **💻 GitHub** | https://github.com/bobaoxu2001/worldcup-oracle-agent |
| **🎥 Demo video** | _paste your 3-min link_ |

> The deployed demo **works with zero API keys** — deterministic Elo + Dixon-Coles + Monte Carlo engine, curated demo news, and an in-memory fallback. **Production is live on MongoDB Atlas with the DeepSeek hybrid LLM layer active.** Add `MONGODB_URI`, a news key (e.g. `GNEWS_API_KEY`), or `DEEPSEEK_API_KEY` (or `GOOGLE_API_KEY` for the Gemini fallback) to light up live memory, live news, and LLM-enhanced multilingual analyst narratives.

---

## ⚡ Elevator pitch

WorldCup Oracle Agent is a **daily news-aware AI agent** for the 2026 World Cup. Ask it a football question in plain English and it plans the analysis, pulls the latest injury & squad news, runs 10,000 Monte Carlo simulations, shows how the news moves the odds, remembers the session in MongoDB, and answers your follow-ups — like a prediction model and a football news desk fused into one agent.

---

## 💡 Inspiration

Most "AI predictors" are either a static stats dashboard or a single LLM call that makes numbers up. Neither feels like an **agent**, and neither feels **current** — real football fans care about *today's* team news (who's injured, who got called up, who's suspended) as much as long-run ratings.

We wanted an agent that visibly **reasons in steps**, grounds its numbers in a real statistical model, stays **timely** by folding in daily news, and **remembers** — so a follow-up like *"does that injury change the prediction?"* actually works. MongoDB became the natural memory layer for that.

---

## 🔮 What it does

- **Understands** a natural-language question (English or 中文) and **plans** the right analysis across **10+ intent types**: match prediction · tournament forecast · **group qualification** · **team comparison** · **rules explanation** · **model explanation** · team analysis · path-to-the-final · scenario what-if · team-news digest.
- **Resolves** teams from casual names (`USA`, `Türkiye`, `the Netherlands`).
- **Pulls recent team news** (injuries, returns, call-ups, suspensions, tactics) for both sides and **classifies** each item (category · impact · direction).
- **Scores news impact** with a transparent, capped signal layer and shows **base vs news-adjusted** probabilities with per-outcome deltas.
- **Simulates** the matchup **10,000 times** (Elo → Dixon-Coles → Monte Carlo).
- **Explains** the result in plain English, plus a fan insight and an optional TikTok-style script.
- **Remembers** every session in MongoDB and answers **follow-ups** ("What if Germany's injured defender returns?").
- **Agent Memory Center** (`/memory`) makes the memory layer visible: backend status, recent sessions, stored news signals, last refresh.
- **Global Voice Mode:** fans can ask predictions by voice and hear responses in **English, Chinese, Spanish, Portuguese, or Japanese** — native browser speech APIs, no extra key, with deterministic localized summaries (numbers never change) and optional Gemini-translated prose.

---

## 🛠️ How we built it

- **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS** — a dark "stadium-night" UI that reads well on a screen recording.
- **Prediction engine** — a TypeScript port of an Elo → Dixon-Coles bivariate-Poisson → Monte Carlo model. Match probabilities are closed-form; the tournament uses a seeded 10,000-run Monte Carlo over the **official FIFA 2026 bracket** (R32 slots 73–88, Annex C best-third routing — validated for all 495 combinations via `npm run validate:bracket`).
- **Agent pipeline** — plain, typed, inspectable functions in `lib/agent/*`:
  `planner → matchResolver → newsResolver → impactAnalyzer → predictionEngine → simulator → explanationGenerator → MongoDB memory`. The reasoning timeline shown to the user mirrors these steps.
- **News intelligence** — `lib/news/*`: a multi-source provider abstraction (NewsAPI / GNews / SerpAPI / Google Custom Search), a deterministic keyword classifier, a MongoDB-backed store, and curated demo signals as a zero-key fallback.
- **DeepSeek hybrid LLM layer** (`lib/llm/*`) for intent understanding, analyst narrative, and Chinese localization — the deterministic engine remains the single source of truth for all numbers and rules.
- **Everything fails soft** — no MongoDB, no DeepSeek/Gemini, no news key? The app still runs end-to-end.

---

## 🍃 MongoDB usage (the memory layer) — ✅ LIVE on MongoDB Atlas

MongoDB is the agent's **memory**, not just a database — and it's **live in production on MongoDB Atlas** at https://worldcup-oracle-agent.vercel.app:

- **MongoDB Atlas persistent memory is live** — the deployed app connects to Atlas and persists across sessions.
- **Every intent type is saved to the `predictions` collection** — match predictions, tournament forecasts, group qualification, team comparisons, and rules/model explanations all persist, with `userQuery`, `intent`, `teams`, `prediction`, `simulationResult`, `reasoningSteps`, `explanation`, `followUpContext`, `createdAt`, plus the extended structured fields (`summary`, `rankings`, `modelFactors`, `rulesApplied`, `newsSignals`, `limitations`, `confidence`, `language`) and the **`llmProvider`** that produced the narrative (`deepseek` / `gemini` / none). The schema extension is backward-compatible, so older records still render. `/memory` shows each session's **intent-type badge**.
- **Team news is stored in the `team_news` collection** — classified daily signals, indexed on `team + publishedAt`, `category`, `impactLevel`, `demo`.
- **Follow-up context** is stored alongside predictions so "what-if" questions re-analyse the right matchup and news.
- **`/memory` shows the backend status and recent saved sessions** read straight from MongoDB.
- **The Data Transparency card on every result shows `Memory: MongoDB Atlas`** (i.e. `persisted: mongodb`) so judges can see the session was written to the database.

Status is also exposed as JSON at `GET /api/memory/status`. The design stays fail-soft: if the database is ever unreachable, a global in-process store transparently takes over so the agent never blocks — but in production it runs on Atlas.

---

## 🤖 Cost-aware hybrid LLM layer — DeepSeek (default) + Gemini (premium escalation) · deterministic engine = source of truth

The agent uses a **cost-aware provider router**: DeepSeek handles routine narrative/localization tasks, while Gemini is reserved for complex multi-step reasoning, ambiguous intent resolution, and fallback. Deterministic TypeScript code owns every number; the LLM layer only handles language.

**Provider chain (`lib/llm/provider.ts`):**

1. **Deterministic router first** — if the heuristic parser confidently classifies the intent and the engines produce a structured result, that result is the source of truth (numbers, rules, simulations, rankings).
2. **DeepSeek — the low-cost default** (`deepseek-chat` via REST): routine intent refinement, standard analyst narrative, Chinese localization, team comparison, model explanation, and most common questions.
3. **Gemini — premium escalation** (`gemini-2.0-flash` via REST): `selectLLMProvider()` routes a query to Gemini when `assessComplexity()` flags it — multi-step tournament reasoning, **path-to-final**, **group qualification / best-third-place** logic, **rules + prediction combined**, **more than two teams**, ambiguous intent, low deterministic confidence, or long-form Chinese explanations. Gemini is also the **fallback when DeepSeek fails/times out**.
4. **Graceful fallback** — if Gemini isn't configured → DeepSeek; if neither is configured → deterministic templates. No loss of correctness.

```
selectLLMProvider(structuredResult, query, language, complexity) → "deepseek" | "gemini" | "none"
```

> **Hard rules:** the structured JSON is the LLM's **only** source of truth — it copies probabilities/rankings verbatim and is forbidden from inventing probabilities, news, injuries, suspensions, or sources. We deliberately do **not** claim "Gemini generates all answers."

**Transparency:** every answer's **Data Transparency** card and the "Why?" badge show the **actual provider used** — `DeepSeek-enhanced`, `Gemini-enhanced`, or `Deterministic` — and the provider is persisted to MongoDB with the result. Routing is covered by a unit test suite (`npm run test:routing`, 22 checks).

---

## 📐 Rules-aware 2026 World Cup engine

WorldCup Oracle is **rules-aware**, not just a matchup model:

- **Official 2026 format & bracket** reused from a validated module (`lib/prediction-engine/bracket-2026.ts`) — 48 teams, 12 groups, top-2 + 8 best third-placed teams → R32 (Annex C routing, all 495 combinations validated).
- **FIFA group tiebreakers** in the correct order — points → overall goal difference → overall goals → head-to-head → fair play → FIFA ranking.
- **Configurable discipline model** (`lib/prediction-engine/discipline.ts`) — yellow-card / red-card fair-play points and suspension thresholds power the suspension-risk read and the "do cards affect group ranking?" explainer.

The agent can therefore **explain the rules** (best-third advancement, card/fair-play effects, tiebreakers) — in English or 中文 — not just output probabilities.

---

## 🧩 Agent workflow & MCP-assisted development

**The app is designed around an explicit agent workflow** (not a single chatbot call):

```
intent planning → intent routing → rules/simulation engines → memory → LLM narrative → MongoDB persist
```

Each stage is a real, inspectable TypeScript function and the reasoning timeline is shown live to the user.

**MCP was used on the development & deployment side** (via connected tools in our agent IDE), not as a production runtime dependency:

- **Vercel MCP** — connected and used to inspect project/deployment/runtime state during the deploy; environment-variable management and the production redeploy were performed with the **Vercel CLI** (`vercel env add`, `vercel redeploy`).
- **Browser-automation MCP + Playwright** and a **local-preview MCP** — used to drive the live app and **capture the production screenshots** and verify behavior.

> **Honest scope:** this is an **MCP-assisted development/deployment workflow**. We did **not** use **MongoDB MCP**, **GitHub MCP**, or **Google Cloud Agent Builder**, and no MCP server runs inside the deployed app. MongoDB integration is a **runtime** integration via the official `mongodb` Node driver (see below); git operations used the `git`/`gh` CLI.

---

## ✅ Hackathon compliance

| Requirement | Status |
|---|---|
| **Hosted project URL** | https://worldcup-oracle-agent.vercel.app (live, zero-config) |
| **Public repository** | https://github.com/bobaoxu2001/worldcup-oracle-agent |
| **Open-source license** | **MIT** (`LICENSE` in repo root) |
| **MongoDB track integration** | **MongoDB Atlas** is the live production **memory layer** via the official `mongodb` driver — `predictions` (all intent types) + `team_news` collections, follow-up context, status surfaced at `/memory` and `GET /api/memory/status` |
| **MCP usage** | MCP-assisted **development/deployment** (Vercel MCP inspection; browser/preview MCP for screenshots & verification). Not a production runtime dependency. |
| **Gemini / Google usage** | **Google Gemini** (`gemini-2.0-flash`, `lib/llm/gemini.ts`) is **live in production** as the **premium escalation provider** in the cost-aware router — it handles complex multi-step reasoning, ambiguous intent, and DeepSeek fallback. DeepSeek remains the low-cost default. |
| **Agent behavior beyond chat** | Plans, classifies intent (10+ types), routes to deterministic rules/simulation engines, persists to memory, explains results, answers follow-ups. |
| **Multi-step workflow** | Visible reasoning timeline: plan → resolve → news → impact → engine → Monte Carlo → narrate → persist. |
| **Demo video** | _paste your 3-min link_ |

---

## 🧗 Challenges we ran into

- **Tournament correctness.** The 2026 format isn't a generic seeded bracket — it's fixed R32 slots plus FIFA's "Annex C" best-third routing (C(12,8) = 495 combinations). We encoded the official slots and wrote a deterministic bipartite matcher that produces a rules-valid third-placed assignment for **all 495**, verified by a test suite.
- **Keeping news honest.** Without a paid news key we use curated demo signals — so we label them clearly as "sample signals" and use generic player roles ("starting defender") to never fake attributions.
- **Making news *move* the model transparently.** We capped the news effect (≤ ±10 pts/team, redistributed 60/40 to opponent/draw) and render an explicit **base → adjusted** table, so the layer is explainable, never a black box.
- **Demo reliability.** Every external dependency (MongoDB, Gemini, news APIs) degrades gracefully so the flagship demo always works.

---

## 🏆 Accomplishments we're proud of

- A genuinely **agentic** product: a visible, inspectable pipeline with planning, tool steps, and memory — not a single prompt.
- **News-aware predictions** with a transparent base-vs-adjusted view.
- A **Data Transparency card** on every result — judges can see exactly what produced the answer (Elo · Dixon-Coles · 10k Monte Carlo · live/demo news · MongoDB/in-memory · DeepSeek/deterministic), reflecting the live runtime state. No black-box "AI numbers."
- A **rules-aware, multi-intent agent** — match prediction, tournament forecast, group qualification, team comparison, and rules/model explanations, in English and 中文.
- **Live or demo news, clearly labelled** — plug in a GNews/SerpAPI/NewsAPI/Google CSE key for live mode; otherwise honest, generic sample signals.
- **Official, validated** 2026 bracket (all 495 Annex C combinations pass).
- **MongoDB as a first-class memory layer** with a dedicated Memory Center.
- **Zero-config** end-to-end: clone, `npm install`, `npm run dev`.

---

## 🔭 What's next

- Native **Gemini function-calling** so the LLM drives the pipeline (planner → tools).
- **Richer live news** — cross-provider dedupe, real player entity resolution, recency weighting.
- **MongoDB Atlas Vector Search** over news + historical matches for "find similar situations."
- **Multi-turn memory recall** — the agent cites its own past predictions in follow-ups.
- A user **bracket builder** to simulate custom knockout paths.

---

## 💬 Recommended demo prompts

1. **Who will win Argentina vs Germany based on the latest team news?** _(flagship)_
2. Does Germany's injury news change the prediction?
3. What if Germany's injured defender returns?
4. Show me the latest Argentina team news before predicting.
5. Which team has the best chance to win the 2026 World Cup?
6. **谁会赢得世界杯冠军？** _(Chinese tournament forecast — DeepSeek-enhanced)_
7. **Compare Argentina and France** _(team comparison)_
8. **How do best third-place teams advance?** _(rules explanation)_
9. **黄牌会影响小组排名吗？** _(yellow-card / fair-play rules, in Chinese)_
10. **How does your model work?** _(model explanation)_

---

## 🎬 Demo script (≈ 2 minutes, live)

1. **Land on the home page.** "This is an AI agent for the 2026 World Cup — news-aware, with MongoDB memory." Point at the chips: *48 teams · real 2026 draw*, *Elo + Dixon-Coles + Monte Carlo*, *Daily news-aware*.
2. **Click the flagship prompt:** *"Who will win Argentina vs Germany based on the latest team news?"*
   - Watch the **agent reasoning timeline** run: gather data → resolve daily news → injury/squad impact → analyze strength → run 10,000 sims → report.
   - **Prediction card** appears with win/draw/loss bars + 10,000 simulations.
   - **Latest News Impact**: show the **base → adjusted** table (Germany −3 pts from a high-impact defender injury) and the "Impact:" explanation.
   - Point at **"Saved to agent memory · MongoDB / In-memory."**
3. **Click the follow-up** *"What if Germany's injured defender returns?"* — the agent re-analyses and Germany's odds recover. "It remembered the matchup and the news."
4. **Global Voice Mode (optional, ~10s):** switch the language to **Español**, ask the same question by voice, and play the spoken answer — the result reads back in Spanish.
5. **Open `/memory` (Agent Memory Center).** Show the memory backend, recent sessions, stored `team_news` signals, last news update, and "Why MongoDB matters."
6. **Open `/news` (Daily Team News).** Switch teams, show impact/category/source badges, hit **Refresh news now**.
7. Close: "Statistical rigor + daily news intelligence + agent memory + global voice — that's WorldCup Oracle Agent."

---

## 🎥 3-minute video script

> **[0:00–0:20] Hook.** "Most AI predictors either spit out a number or make one up. WorldCup Oracle Agent is different — it's a news-aware AI agent that reasons step by step, runs real simulations, and remembers." Show the home page.

> **[0:20–0:35] The ask.** Type/click *"Who will win Argentina vs Germany based on the latest team news?"* "Plain English in — let's watch the agent work."

> **[0:35–1:05] The pipeline.** Narrate the reasoning timeline as steps complete: "It gathers match data, pulls **recent team news**, analyzes the **injury and squad impact**, then runs **10,000 Monte Carlo simulations** on the official 2026 bracket." Land on the prediction card.

> **[1:05–1:45] News intelligence (the differentiator).** Scroll to **Latest News Impact**. "Germany's starting defender is ruled out — a high-impact injury. The agent shows you **base vs news-adjusted** probabilities: Germany drops three points, redistributed to Argentina and the draw — capped and fully explained, never a black box." Point at the per-team news cards and source/demo badges.

> **[1:45–2:10] Memory + follow-up.** Point at **"Saved to agent memory · MongoDB."** Click **"What if Germany's injured defender returns?"** "It remembers the matchup and re-analyses — Germany's odds bounce back."

> **[2:10–2:40] MongoDB Track.** Open **/memory**. "MongoDB is the agent's memory layer: a `predictions` collection and an indexed `team_news` collection, plus follow-up context. Here's the live backend status, recent sessions, and stored news signals." Hit **Refresh news now**.

> **[2:40–3:00] Close.** "Statistical rigor, daily news intelligence, and real agent memory — and it runs with zero config, failing soft on every external service. That's WorldCup Oracle Agent." Show the GitHub repo + MIT license.

---

*Predictions are model estimates for entertainment & informational use only. Not betting or financial advice.*
