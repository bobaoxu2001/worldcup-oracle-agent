# 🔮 WorldCup Oracle Agent

> **A daily news-aware AI agent that analyzes World Cup 2026 matchups, factors in the latest injuries & squad news, runs simulations, explains its predictions, and answers follow-up questions in real time.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-memory%20layer-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-ready-4285F4?logo=googlegemini&logoColor=white)
![News-aware](https://img.shields.io/badge/News-aware-39FF88)
![Monte Carlo](https://img.shields.io/badge/Monte%20Carlo-10%2C000%20runs-2D9BFF)
![License](https://img.shields.io/badge/License-MIT-green)

**🏆 Google Cloud Rapid Agent Hackathon — MongoDB Track**
&nbsp;·&nbsp; 📜 MIT Licensed &nbsp;·&nbsp; ⚡ Runs with zero config

| | |
|---|---|
| **🔗 Live demo** | _paste your Vercel URL_ → `https://<your-deployment>.vercel.app` |
| **📝 Devpost** | _paste your Devpost submission URL_ |
| **🎥 Demo video** | _paste your 3-min YouTube/Loom link_ |
| **💻 Source** | https://github.com/bobaoxu2001/worldcup-oracle-agent |

> **Why the MongoDB Track:** MongoDB is the agent's **memory layer** — two collections,
> `predictions` (every session's probabilities, simulation & reasoning) and `team_news`
> (classified daily news signals, indexed by team / impact / category), plus the follow-up
> context that lets the agent re-analyse "what-if" questions. See the **[Agent Memory Center](#-agent-memory-center-mongodb-track)** and live it at `/memory`.

WorldCup Oracle Agent is **not** a static prediction dashboard. You ask a football question in plain English — *"Who will win Argentina vs Germany based on the latest team news?"* — and watch an agent **plan** the analysis, **resolve** the teams, **pull recent injury & squad news**, **run 10,000 Monte Carlo simulations**, **explain how the latest updates move the line**, **remember** the result, and **answer your follow-ups** (*"Does Germany's injury news change the prediction?"*).

It feels like **a World Cup prediction model + a daily football news intelligence agent** in one.

## 📸 Screenshots

> _Add the four images below before submitting — drop the PNGs into `docs/screenshots/`
> (filenames already referenced here). Capture them by running `npm run dev` and using the
> flagship prompt **"Who will win Argentina vs Germany based on the latest team news?"**, then visiting `/memory`._

| Home — agent chat | Agent reasoning timeline |
|---|---|
| ![Home](docs/screenshots/home.png) | ![Agent timeline](docs/screenshots/agent-timeline.png) |
| **Latest News Impact (base vs adjusted)** | **Agent Memory Center (`/memory`)** |
| ![News impact](docs/screenshots/news-impact.png) | ![Memory Center](docs/screenshots/memory-center.png) |

---

## What it does

1. **Understands** a natural-language football question.
2. **Plans** the right analysis (single match · what-if scenario · tournament winner · social preview · **team-news digest**).
3. **Resolves** the teams from casual names (`USA`, `Türkiye`, `the Netherlands`) → canonical profiles.
4. **Pulls recent team news** — injuries, returns, call-ups, suspensions, tactical & form updates — for both teams.
5. **Scores news impact** with a transparent, capped signal layer and **nudges the probabilities**.
6. **Analyzes** team strength (Elo, host advantage, expected goals, draw likelihood).
7. **Simulates** the matchup **10,000 times** with a seeded Monte Carlo engine.
8. **Generates** a fan-friendly, news-aware prediction report (probabilities, scoreline, confidence, upset risk, *Latest News Impact*).
9. **Explains** the reasoning in plain English — including *how the latest news affects the matchup* — plus a fan insight and optional TikTok-style script.
10. **Remembers** every interaction in MongoDB (with a zero-config in-memory fallback).
11. **Answers follow-ups** like *"Does the injury news change the prediction?"* or *"What changed in Brazil's squad this week?"*.
12. **Shows its work** — a **Data Transparency** card on every result reveals exactly what produced it (Elo · Dixon-Coles · 10k Monte Carlo · live/demo news · MongoDB/in-memory · Gemini/deterministic), reflecting the live runtime state.

## Why it's an agent (not just an LLM call)

The product is built as an explicit **agent pipeline** — each stage is a real, inspectable function, and the agent's reasoning timeline is shown to the user as it works:

```
User Query
  → Agent Planner             classify intent, choose the plan        lib/agent/planner.ts
  → Match Data Resolver        free text → canonical team profiles     lib/agent/matchResolver.ts
  → Daily News Resolver        recent injuries / squad / tactics news  lib/agent/newsResolver.ts
  → Injury/Squad Impact        capped, transparent probability nudge   lib/agent/impactAnalyzer.ts
  → Prediction Engine          Elo + Dixon-Coles closed-form 1X2       lib/prediction-engine/
  → Monte Carlo Simulator      10,000 seeded simulated matches         lib/agent/simulator.ts
  → Explanation Generator      plain-English + fan insight + TikTok     lib/agent/explanationGenerator.ts
  → MongoDB Memory             persist the interaction (fail-soft)      lib/db/mongodb.ts
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
| News intelligence | Multi-source provider abstraction (`lib/news/*`) + classifier + capped impact analyzer, with curated demo fallback |
| Memory | **MongoDB** (`mongodb` driver) — `predictions` + `team_news`, with automatic in-memory fallback |
| LLM (optional) | **Google Gemini** (`gemini-2.0-flash` via REST) — narrative polish only |
| News APIs (optional) | NewsAPI · GNews · SerpAPI · Google Custom Search |
| Deploy | Vercel-ready (all external services degrade gracefully) |

### The prediction model

The statistical core is a TypeScript port of a calibrated World Cup model:

- **Elo ratings** for all 48 qualified nations (real 2026 final-draw field).
- **Dixon-Coles** bivariate Poisson goal model (ρ = −0.13) for closed-form 1X2 probabilities and a scoreline grid.
- **Monte Carlo**: a seeded PRNG (mulberry32) samples 10,000 matches per fixture for the simulation view, and a full 48-team tournament (groups → best thirds → knockouts) for title odds — memoised and reproducible.
- **Host advantage**: USA / Canada / Mexico carry a +75 Elo home bonus.

---

## 🏆 2026 World Cup format accuracy

The tournament simulation follows the **official FIFA 2026 format and bracket routing** — not a generic seeded bracket.

**Format**
- **48 teams**, **12 groups of 4** (A–L).
- Qualification to the Round of 32: **12 group winners + 12 runners-up + the 8 best third-placed teams** = **32 teams**. This is explicit in `simulateTournament()` and enforced by the validation suite.

**Group ranking (FIFA tiebreakers)** — `lib/prediction-engine/engine.ts`
1. points → 2. goal difference → 3. goals scored
4. **head-to-head** among still-tied teams (H2H points → H2H GD → H2H GF), computed from the simulated group matches
5. fair play / drawing of lots → **approximated** by team rating (Elo) then a deterministic key, because a forward Monte Carlo simulation has no disciplinary/fair-play data. *(Documented approximation.)*

The 8 best third-placed teams are ranked across groups by points → GD → GF → (fair-play/lots ≈ Elo).

**Official Round of 32 routing** — `lib/prediction-engine/bracket-2026.ts`

Every slot is fixed in advance (no performance seeding):

```
M73 2A v 2B      M74 1E v 3rd      M75 1F v 2C      M76 1C v 2F
M77 1I v 3rd     M78 2E v 2I       M79 1A v 3rd     M80 1L v 3rd
M81 1D v 3rd     M82 1G v 3rd      M83 2K v 2L      M84 1H v 2J
M85 1B v 3rd     M86 1J v 2H       M87 1K v 3rd     M88 2D v 2G
```

Round of 16 → Final follow the fixed match-number tree (89–96 → 97–100 → 101–102 → 104).

**Third-place assignment (FIFA Annex C)**

Which third-placed team fills each "3rd" slot depends on *which 8 of the 12 groups* produced the best thirds. Each slot only accepts thirds from an allowed set of groups:

| Slot | 1st-seed | Allowed third-placed groups |
|------|----------|-----------------------------|
| M74 | 1E | A, B, C, D, F |
| M77 | 1I | C, D, F, G, H |
| M79 | 1A | C, E, F, H, I |
| M80 | 1L | E, H, I, J, K |
| M81 | 1D | B, E, F, I, J |
| M82 | 1G | A, E, H, I, J |
| M85 | 1B | E, F, G, I, J |
| M87 | 1K | D, E, I, J, L |

`assignThirdPlaceSlots()` resolves the 8 qualifying groups to these slots with a **deterministic bipartite matching** that honours the allowed sets — guaranteeing a rules-valid assignment for **all C(12,8) = 495 combinations** (verified by the test suite). An optional `EXACT_ANNEX_C` table can pin FIFA's exact published slot for any combination; the matcher is the safe, fully-covering fallback.

**Validate it**

```bash
npm run validate:bracket
```

Confirms: official R32 spec (no generic seeding) · 12 winners + 12 runners-up + 8 thirds placed correctly · all 495 Annex C combinations resolve to allowed slots · every R32 has exactly 32 distinct teams · champion Monte Carlo runs with a monotonic reach funnel.

**Current limitations**
- Fair-play / drawing-of-lots tiebreakers are approximated (Elo + deterministic key) — no disciplinary data exists in a forward simulation.
- `EXACT_ANNEX_C` overrides are not yet populated; for the rare combinations with more than one valid matching, the computed slot may differ from FIFA's published row (still always rules-valid). Marked with a `TODO(annex-c)`.

---

## 📰 Daily news intelligence

This is what makes the agent feel *current*. Instead of reasoning only over static team strength, it pulls recent team news and folds it into the prediction.

### How news ingestion works

```
provider.fetchTeamNews()  →  classify()  →  store (team_news)  →  agent reads it at prediction time
   lib/news/newsProvider.ts   newsClassifier.ts   teamNewsStore.ts        lib/agent/newsResolver.ts
```

- **`lib/news/newsProvider.ts`** — a pluggable, multi-source abstraction. The first configured provider wins: **NewsAPI**, **GNews**, **SerpAPI (Google News)**, or **Google Custom Search**. Every call is timed out and wrapped, so a flaky API can never break a prediction.
- **`lib/news/newsClassifier.ts`** — deterministic keyword heuristics tag each item with a **category** (`injury · squad · form · tactics · suspension · coach · other`), an **impact level** (`low · medium · high`), a **direction** (`negative · positive · neutral`) and any generic role mentions.
- **`lib/news/teamNewsStore.ts`** — persists to MongoDB `team_news` (indexed), with an in-memory fallback.
- **`lib/news/newsIngestor.ts`** — orchestrates fetch → classify → store, and seeds curated demo signals when the store is empty.
- **`lib/agent/newsResolver.ts` + `impactAnalyzer.ts`** — the agent's news steps at prediction time.

### Demo-safe fallback (no API key needed)

With **no news/search API key**, the agent uses curated **demo signals** for Argentina, Germany, Brazil, France, Portugal, England, USA, Mexico, Spain and Netherlands. To keep things honest:

- every demo item is flagged and shown in the UI as **"Demo news data / sample signals"** — never presented as verified real news;
- demo player references are **generic** ("key midfielder", "starting defender", "young forward") so nothing is falsely attributed to a real person. Real names only ever appear from a live API.

### How news adjusts the probabilities

A deliberately **simple, transparent, capped** signal layer on top of the base simulation (`lib/agent/impactAnalyzer.ts`):

| Impact | Effect on the affected team's win probability |
|--------|-----------------------------------------------|
| **High** (e.g. defender ruled out) | −4.5 pts to that team; redistributed ~60/40 to the opponent's win and the draw |
| **Medium** | −2 pts |
| **Low** | mentioned in reasoning, **no** probability change |

Positive news (a key player returning) nudges the other way. Each team's total swing is **capped at ±10 pts**, and probabilities are re-normalised to exactly 100%. The UI shows the **base → adjusted** shift per outcome.

> *News impact is a lightweight signal layer on top of the base simulation, not a replacement for the prediction model — and not financial or betting advice.* The agent uses careful language: *"Based on currently available news signals…"*

### News API routes

| Route | What it does |
|-------|--------------|
| `GET \| POST /api/news/refresh` | Refresh news for all tracked teams (`?team=brazil` for one). Fetches → classifies → stores. Returns a summary. |
| `GET /api/news/team/[team]?limit=8` | Recent news for one team, newest first (limit 1–10). |

### Scheduling the daily refresh

The refresh endpoint is designed to be hit once a day by any scheduler:

- **Vercel Cron** — already wired in [`vercel.json`](vercel.json):
  ```json
  { "crons": [{ "path": "/api/news/refresh", "schedule": "0 6 * * *" }] }
  ```
- **GitHub Actions / any cron** — `curl -fsS https://<your-app>/api/news/refresh`

If a refresh fails, the app keeps running on existing (or demo) data.

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

### `team_news` collection

The daily news intelligence layer uses a second collection, **`team_news`**, indexed on **`team` + `publishedAt`**, **`category`** and **`impactLevel`** (created automatically on first write). Each document is a `TeamNewsItem`:

```ts
{
  team: string, title: string, summary: string,
  category: "injury" | "squad" | "form" | "tactics" | "suspension" | "coach" | "other",
  impactLevel: "low" | "medium" | "high",
  direction: "negative" | "positive" | "neutral",
  affectedPlayers: string[],
  sourceName: string, sourceUrl: string,
  publishedAt: Date, createdAt: Date,
  demo: boolean   // true for curated sample signals
}
```

**Fail-soft guarantee:** if `MONGODB_URI` is missing, invalid, or unreachable, both collections transparently use an in-process memory store with a short connection timeout. **MongoDB errors never break a prediction** — the UI even shows which backend served the data (`MongoDB` vs `In-memory`).

---

## 🧠 Agent Memory Center (MongoDB Track)

Visit **`/memory`** for a live view of the agent's MongoDB-backed memory — MongoDB is the agent's **memory layer, not just storage**:

- **Memory backend** — MongoDB Atlas vs in-memory fallback, with live connection status and session count.
- **Recent prediction sessions** — replayed from the `predictions` collection.
- **Stored team-news signals** — recent classified items from `team_news`, per team.
- **News intelligence status** — Live (with provider) vs Demo mode, total stored signals, and **last news update** time. A **"Refresh news now"** button triggers the daily-style refresh on demand.
- **Why MongoDB matters** — `predictions` + `team_news` + follow-up context, called out explicitly.

Status is also available as JSON at **`GET /api/memory/status`**.

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
| `MONGODB_URI` | Agent memory + `team_news` (MongoDB Partner Track) | Falls back to in-memory store |
| `MONGODB_DB` | Database name (default `worldcup_oracle`) | Uses default |
| `GOOGLE_API_KEY` | Gemini narrative polish | Uses deterministic generator |
| `NEWS_API_KEY` | Live team news via NewsAPI.org | Uses curated demo signals |
| `GNEWS_API_KEY` | Live team news via GNews.io | Uses curated demo signals |
| `SERPAPI_API_KEY` | Live team news via SerpAPI (Google News) | Uses curated demo signals |
| `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_ENGINE_ID` | Live team news via Google Custom Search | Uses curated demo signals |
| `NEXT_PUBLIC_APP_URL` | Absolute URL for metadata | Defaults to `localhost:3000` |

> Configure **any one** of the news providers to go live — the first one set wins. With none set, the agent runs on clearly-labelled demo signals.

> **No environment variables are required for the demo.** Without keys, the app runs in
> **deterministic + demo-news + in-memory** fallback mode and every feature still works.

### Deploy to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new) (framework auto-detects as Next.js).
2. **No env vars needed** for a working demo. To enable the live paths, add any of the variables above in **Project → Settings → Environment Variables**:
   - `MONGODB_URI` (+ optional `MONGODB_DB`) → real agent memory (Atlas)
   - `GNEWS_API_KEY` (or `SERPAPI_API_KEY` / `NEWS_API_KEY` / `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_ENGINE_ID`) → live news
   - `GOOGLE_API_KEY` → Gemini-enhanced explanations
   - `NEXT_PUBLIC_APP_URL` → your deployed URL (for metadata/OG)
3. Deploy. The included [`vercel.json`](vercel.json) registers a **daily cron** that calls `/api/news/refresh` at 06:00 UTC to keep `team_news` fresh.
4. Paste the resulting URL into the table at the top of this README and into `DEVPOST.md`.

Build is standard `next build` — verified locally green; all external services degrade gracefully, so the first deploy succeeds even with zero env vars.

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

1. `Who will win Argentina vs Germany based on the latest team news?` — **the flagship** news-aware demo
2. `Does Germany's injury news change the prediction?` — news-driven re-analysis
3. `What if Germany's injured defender returns?` — scenario re-analysis (odds recover)
4. `Show me the latest Argentina team news before predicting` — team-news digest
5. `Which team has the best chance to win the 2026 World Cup?` — full-tournament Monte Carlo

More to try: `Predict France vs Portugal and include news impact` · `What changed in Brazil's squad this week?` · `Give me a TikTok-style match preview for England vs Germany`

Also visit **`/news`** (Daily Team News) to browse recent injuries / squad / tactics updates per team and trigger a manual refresh.

---

## Hackathon relevance

WorldCup Oracle Agent transforms a traditional World Cup prediction model into a **daily news-aware AI agent** that can reason through football matchups, factor in the latest injuries and squad changes, run simulations, generate fan-friendly predictions, and remember previous prediction sessions. It combines **statistical modeling** with a full **agent workflow** — planning, data resolution, **daily news intelligence**, impact analysis, simulation, reasoning, explanation, and memory — which is exactly what the Rapid Agent Hackathon (and the MongoDB Partner Track) reward.

## Future roadmap

- **Native Gemini function-calling** so the LLM drives the pipeline (planner → tools) instead of only narrating.
- **Richer news ingestion** — dedupe across providers, entity resolution to real player names, recency weighting.
- **Multi-turn memory recall** — the agent cites its own past predictions and news in follow-ups.
- **Bracket builder** — simulate a user's custom knockout path.
- **Vector search over news & historical matches** (MongoDB Atlas Vector Search) for "find similar fixtures / situations."

---

## ✅ Submission checklist

- [x] **Agentic product** — explicit, inspectable pipeline (planner → resolver → news → impact → engine → simulator → explainer → memory) with a visible reasoning timeline.
- [x] **MongoDB Track** — `predictions` + `team_news` collections (indexed) as the agent's memory layer; live status at `/memory`.
- [x] **Google Cloud / Gemini-ready** — single Gemini seam (`lib/llm/gemini.ts`); deterministic fallback when no key.
- [x] **Runs with zero config** — predictions, simulations, news and memory all work with an empty `.env`.
- [x] **Fail-soft** — missing/invalid MongoDB, Gemini or news keys never break the demo.
- [x] **Open source** — [MIT `LICENSE`](LICENSE).
- [x] **Docs** — README + [`DEVPOST.md`](DEVPOST.md) (pitch, build, demo + 3-min video script).
- [x] **Quality gates** — `npm run typecheck`, `npm run build`, `npm run validate:bracket` all pass.
- [ ] **Live demo URL** — deploy to Vercel and paste the link at the top of this README.
- [ ] **Demo video** — record the 3-minute script in `DEVPOST.md` and paste the link.

## 📜 License

This project is open source under the [MIT License](LICENSE) — free to use, modify, and distribute. © 2026 WorldCup Oracle Agent contributors.

---

*Predictions are model estimates for entertainment & informational use only. Not betting or financial advice.*
