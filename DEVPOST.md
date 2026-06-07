# WorldCup Oracle Agent — Devpost

**Google Cloud Rapid Agent Hackathon · MongoDB Track**

---

## ⚡ Elevator pitch

WorldCup Oracle Agent is a **daily news-aware AI agent** for the 2026 World Cup. Ask it a football question in plain English and it plans the analysis, pulls the latest injury & squad news, runs 10,000 Monte Carlo simulations, shows how the news moves the odds, remembers the session in MongoDB, and answers your follow-ups — like a prediction model and a football news desk fused into one agent.

---

## 💡 Inspiration

Most "AI predictors" are either a static stats dashboard or a single LLM call that makes numbers up. Neither feels like an **agent**, and neither feels **current** — real football fans care about *today's* team news (who's injured, who got called up, who's suspended) as much as long-run ratings.

We wanted an agent that visibly **reasons in steps**, grounds its numbers in a real statistical model, stays **timely** by folding in daily news, and **remembers** — so a follow-up like *"does that injury change the prediction?"* actually works. MongoDB became the natural memory layer for that.

---

## 🔮 What it does

- **Understands** a natural-language question and **plans** the right analysis (single match · scenario what-if · tournament winner · social preview · team-news digest).
- **Resolves** teams from casual names (`USA`, `Türkiye`, `the Netherlands`).
- **Pulls recent team news** (injuries, returns, call-ups, suspensions, tactics) for both sides and **classifies** each item (category · impact · direction).
- **Scores news impact** with a transparent, capped signal layer and shows **base vs news-adjusted** probabilities with per-outcome deltas.
- **Simulates** the matchup **10,000 times** (Elo → Dixon-Coles → Monte Carlo).
- **Explains** the result in plain English, plus a fan insight and an optional TikTok-style script.
- **Remembers** every session in MongoDB and answers **follow-ups** ("What if Germany's injured defender returns?").
- **Agent Memory Center** (`/memory`) makes the memory layer visible: backend status, recent sessions, stored news signals, last refresh.

---

## 🛠️ How we built it

- **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS** — a dark "stadium-night" UI that reads well on a screen recording.
- **Prediction engine** — a TypeScript port of an Elo → Dixon-Coles bivariate-Poisson → Monte Carlo model. Match probabilities are closed-form; the tournament uses a seeded 10,000-run Monte Carlo over the **official FIFA 2026 bracket** (R32 slots 73–88, Annex C best-third routing — validated for all 495 combinations via `npm run validate:bracket`).
- **Agent pipeline** — plain, typed, inspectable functions in `lib/agent/*`:
  `planner → matchResolver → newsResolver → impactAnalyzer → predictionEngine → simulator → explanationGenerator → MongoDB memory`. The reasoning timeline shown to the user mirrors these steps.
- **News intelligence** — `lib/news/*`: a multi-source provider abstraction (NewsAPI / GNews / SerpAPI / Google Custom Search), a deterministic keyword classifier, a MongoDB-backed store, and curated demo signals as a zero-key fallback.
- **Everything fails soft** — no MongoDB, no Gemini, no news key? The app still runs end-to-end.

---

## 🍃 MongoDB usage (the memory layer)

MongoDB is the agent's **memory**, not just a database:

- **`predictions`** — every session: `userQuery`, `intent`, `teams`, `prediction` (probabilities + confidence), `simulationResult`, `reasoningSteps`, `explanation`, `followUpContext`, `createdAt`.
- **`team_news`** — classified daily news, **indexed** on `team + publishedAt`, `category`, and `impactLevel`: `title`, `summary`, `category`, `impactLevel`, `direction`, `affectedPlayers`, `sourceName`, `sourceUrl`, `publishedAt`, `demo`.
- **Follow-up context** — stored alongside predictions so "what-if" questions re-analyse the right matchup and news.

Surfaced live in the **Agent Memory Center** (`/memory`) and `GET /api/memory/status`. If `MONGODB_URI` is absent or unreachable, a global in-process store transparently takes over (with a 2.5s connection timeout) — the agent never blocks on the DB. The in-memory store is hung off `globalThis` so it's shared across route/page bundles in one process.

---

## ☁️ Google Cloud / Gemini usage

Gemini plugs into one seam — `lib/llm/gemini.ts` (`gemini-2.0-flash` via REST). When `GOOGLE_API_KEY` is set, Gemini **restyles the agent's deterministic explanation** into livelier prose, with strict instructions to preserve every number. When it's not set, the deterministic generator is used and the product is identical. A 6-second timeout means a slow API can never stall the demo. The UI badges each answer **Gemini-enhanced** or **Deterministic engine** so the seam is transparent. This keeps the agent's *reasoning and numbers* trustworthy while leaving a clean path to deeper Gemini (function-calling) integration.

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

## 🎬 Demo script (≈ 2 minutes, live)

1. **Land on the home page.** "This is an AI agent for the 2026 World Cup — news-aware, with MongoDB memory." Point at the chips: *48 teams · real 2026 draw*, *Elo + Dixon-Coles + Monte Carlo*, *Daily news-aware*.
2. **Click the flagship prompt:** *"Who will win Argentina vs Germany based on the latest team news?"*
   - Watch the **agent reasoning timeline** run: gather data → resolve daily news → injury/squad impact → analyze strength → run 10,000 sims → report.
   - **Prediction card** appears with win/draw/loss bars + 10,000 simulations.
   - **Latest News Impact**: show the **base → adjusted** table (Germany −3 pts from a high-impact defender injury) and the "Impact:" explanation.
   - Point at **"Saved to agent memory · MongoDB / In-memory."**
3. **Click the follow-up** *"What if Germany's injured defender returns?"* — the agent re-analyses and Germany's odds recover. "It remembered the matchup and the news."
4. **Open `/memory` (Agent Memory Center).** Show the memory backend, recent sessions, stored `team_news` signals, last news update, and "Why MongoDB matters."
5. **Open `/news` (Daily Team News).** Switch teams, show impact/category/source badges, hit **Refresh news now**.
6. Close: "Statistical rigor + daily news intelligence + agent memory — that's WorldCup Oracle Agent."

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
