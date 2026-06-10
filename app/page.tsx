import { AgentChat } from "@/components/agent/agent-chat";
import { getRecentPredictions } from "@/lib/db/mongodb";
import { geminiConfigured } from "@/lib/llm/gemini";
import { llmConfigured } from "@/lib/llm/provider";
import { mongoConfigured } from "@/lib/db/mongodb";
import { newsProviderConfigured } from "@/lib/news/newsIngestor";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, source } = await getRecentPredictions(6);
  const gemini = geminiConfigured();
  const deepseek = llmConfigured();
  const llmLabel = deepseek ? "DeepSeek-enhanced" : gemini ? "Gemini-enhanced" : "LLM-ready";
  const mongo = mongoConfigured();
  const liveNews = newsProviderConfigured();

  return (
    <div className="container py-8 md:py-12">
      {/* hero */}
      <section className="mx-auto mb-10 max-w-3xl text-center">
        <div className="chip mx-auto mb-4 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse-glow" />
          Google Cloud Rapid Agent Hackathon
        </div>
        <h1 className="text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          The AI agent that <span className="neon-text">predicts the World Cup</span> — with daily
          news intelligence.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Ask a football question in plain English. The agent plans the analysis, pulls{" "}
          <strong className="text-foreground">recent injury & squad news</strong>, runs{" "}
          <strong className="text-foreground">10,000 Monte Carlo simulations</strong>, explains how
          the latest updates move the line, and answers your follow-ups.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <Stat label="48 teams · real 2026 draw" />
          <Stat label="Elo + Dixon-Coles + Monte Carlo" />
          <Stat label={liveNews ? "Live news-aware" : "Daily news-aware"} on={liveNews} />
          <Stat label={llmLabel} on={deepseek || gemini} />
          <Stat label={mongo ? "MongoDB memory" : "Memory fallback"} on={mongo} />
        </div>
      </section>

      <AgentChat initialRecent={{ items, source }} />
    </div>
  );
}

function Stat({ label, on }: { label: string; on?: boolean }) {
  return (
    <span
      className={`chip ${on ? "border-neon/30 text-neon" : ""}`}
    >
      {label}
    </span>
  );
}
