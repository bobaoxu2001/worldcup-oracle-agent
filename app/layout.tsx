import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "WorldCup Oracle Agent — AI Agent for World Cup 2026 Predictions",
  description:
    "An AI agent that understands a football question, plans the analysis, runs 10,000 Monte Carlo simulations, explains its reasoning, remembers past predictions, and answers follow-ups in real time.",
  keywords: [
    "World Cup 2026",
    "AI agent",
    "predictions",
    "Monte Carlo",
    "Elo",
    "Dixon-Coles",
    "Gemini",
    "MongoDB",
  ],
  openGraph: {
    title: "WorldCup Oracle Agent",
    description:
      "AI agent that analyzes World Cup matchups, runs simulations, explains predictions, and answers follow-ups in real time.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="stadium-bg min-h-screen font-sans">
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
            <p>
              WorldCup Oracle Agent · Elo + Dixon-Coles + Monte Carlo · Built for the Google Cloud
              Rapid Agent Hackathon.
            </p>
            <p className="mt-1">
              Predictions are model estimates for entertainment & informational use only.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
