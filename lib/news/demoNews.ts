/**
 * Curated DEMO news data — the zero-config fallback.
 *
 * When no live news/search API key is configured, the agent uses these sample
 * signals so the product still feels current and the demo always works.
 *
 * IMPORTANT, on purpose:
 *   • Every item is flagged `demo: true` and surfaced in the UI as
 *     "Demo news data / Sample signals" — we NEVER present mock items as
 *     verified real news.
 *   • Player names are intentionally GENERIC ("key midfielder", "starting
 *     defender", "young forward") so nothing is falsely attributed to a real
 *     person. Real names only ever appear when sourced from a live API.
 *
 * `hoursAgo` is materialised into a real `publishedAt` at read time so the
 * sample always looks like it was published in the last few days.
 */

import type { NewsCategory, NewsDirection, NewsImpact, TeamNewsItem } from "./types";

export const TRACKED_TEAMS = [
  "argentina",
  "germany",
  "brazil",
  "france",
  "portugal",
  "england",
  "usa",
  "mexico",
  "spain",
  "netherlands",
] as const;

interface DemoTemplate {
  title: string;
  summary: string;
  category: NewsCategory;
  impactLevel: NewsImpact;
  direction: NewsDirection;
  affectedPlayers: string[];
  hoursAgo: number;
}

const DEMO: Record<string, DemoTemplate[]> = {
  argentina: [
    {
      title: "Key midfielder carries minor knock into camp",
      summary:
        "A key midfielder is reported to have a minor muscular concern and is being monitored by the medical staff. Currently expected to be available, but training load is being managed.",
      category: "injury",
      impactLevel: "medium",
      direction: "negative",
      affectedPlayers: ["key midfielder"],
      hoursAgo: 20,
    },
    {
      title: "Young forward called into training camp",
      summary:
        "A young forward has received a call-up and joins the senior squad for the upcoming camp, adding depth to the attacking options.",
      category: "squad",
      impactLevel: "low",
      direction: "positive",
      affectedPlayers: ["young forward"],
      hoursAgo: 52,
    },
  ],
  germany: [
    {
      title: "Starting defender ruled out with injury",
      summary:
        "A starting defender has been ruled out after picking up an injury, a notable blow to the team's defensive stability heading into the fixture.",
      category: "injury",
      impactLevel: "high",
      direction: "negative",
      affectedPlayers: ["starting defender"],
      hoursAgo: 14,
    },
    {
      title: "Replacement defender added to the squad",
      summary:
        "A replacement defender has been added to the squad to cover the injury. The coaching staff are integrating the new call-up into the back line.",
      category: "squad",
      impactLevel: "medium",
      direction: "neutral",
      affectedPlayers: ["replacement defender"],
      hoursAgo: 10,
    },
  ],
  brazil: [
    {
      title: "Forward fitness update ahead of fixture",
      summary:
        "A first-choice forward completed full training after a short fitness scare and is expected to be available for selection.",
      category: "form",
      impactLevel: "low",
      direction: "positive",
      affectedPlayers: ["first-choice forward"],
      hoursAgo: 30,
    },
    {
      title: "Backup goalkeeper managing a minor issue",
      summary:
        "A backup goalkeeper is managing a minor issue and is being assessed day to day. No impact expected on the first-choice lineup.",
      category: "injury",
      impactLevel: "low",
      direction: "negative",
      affectedPlayers: ["backup goalkeeper"],
      hoursAgo: 60,
    },
  ],
  france: [
    {
      title: "Training update: full squad session completed",
      summary:
        "The squad completed a full training session with no new fitness concerns reported. Preparation is on schedule ahead of the match.",
      category: "form",
      impactLevel: "low",
      direction: "positive",
      affectedPlayers: [],
      hoursAgo: 18,
    },
    {
      title: "Wide midfielder back in contention after recovery",
      summary:
        "A wide midfielder has returned to full training following recovery and is back in contention for a starting role.",
      category: "injury",
      impactLevel: "medium",
      direction: "positive",
      affectedPlayers: ["wide midfielder"],
      hoursAgo: 40,
    },
  ],
  portugal: [
    {
      title: "Tactical tweak expected for upcoming match",
      summary:
        "The coaching staff are reportedly preparing a tactical adjustment, shifting shape to add control in midfield for the upcoming fixture.",
      category: "tactics",
      impactLevel: "medium",
      direction: "positive",
      affectedPlayers: [],
      hoursAgo: 16,
    },
    {
      title: "Veteran attacker managing workload",
      summary:
        "A veteran attacker's minutes are being managed carefully, with the staff monitoring fitness across the congested schedule.",
      category: "form",
      impactLevel: "low",
      direction: "negative",
      affectedPlayers: ["veteran attacker"],
      hoursAgo: 48,
    },
  ],
  england: [
    {
      title: "Starting fullback a doubt with minor injury",
      summary:
        "A starting fullback is a doubt after a minor injury in training and is rated day to day by the medical team.",
      category: "injury",
      impactLevel: "medium",
      direction: "negative",
      affectedPlayers: ["starting fullback"],
      hoursAgo: 22,
    },
    {
      title: "Coach confirms settled starting XI",
      summary:
        "The head coach confirmed a largely settled starting XI, signalling continuity and stability ahead of the match.",
      category: "coach",
      impactLevel: "low",
      direction: "positive",
      affectedPlayers: [],
      hoursAgo: 36,
    },
  ],
  usa: [
    {
      title: "Central midfielder returns from injury",
      summary:
        "A central midfielder has returned to full fitness and rejoins the squad, strengthening the middle of the park.",
      category: "injury",
      impactLevel: "medium",
      direction: "positive",
      affectedPlayers: ["central midfielder"],
      hoursAgo: 26,
    },
    {
      title: "New call-up added to attacking options",
      summary:
        "A new call-up has been added, giving the coaching staff an additional attacking option off the bench.",
      category: "squad",
      impactLevel: "low",
      direction: "positive",
      affectedPlayers: ["young forward"],
      hoursAgo: 58,
    },
  ],
  mexico: [
    {
      title: "Starting winger suspended for next match",
      summary:
        "A starting winger will miss the next match through suspension after accumulating cards, forcing a change on the flank.",
      category: "suspension",
      impactLevel: "high",
      direction: "negative",
      affectedPlayers: ["starting winger"],
      hoursAgo: 12,
    },
    {
      title: "Squad completes travel ahead of fixture",
      summary:
        "The squad has completed travel and settled into the host city with preparations proceeding normally.",
      category: "other",
      impactLevel: "low",
      direction: "neutral",
      affectedPlayers: [],
      hoursAgo: 44,
    },
  ],
  spain: [
    {
      title: "Tactical change: higher press expected",
      summary:
        "The staff are expected to deploy a more aggressive high press, aiming to control territory in the upcoming match.",
      category: "tactics",
      impactLevel: "medium",
      direction: "positive",
      affectedPlayers: [],
      hoursAgo: 19,
    },
    {
      title: "Backup defender managing minor knock",
      summary:
        "A backup defender is managing a minor knock and is being assessed, with no impact expected on the first-choice back line.",
      category: "injury",
      impactLevel: "low",
      direction: "negative",
      affectedPlayers: ["backup defender"],
      hoursAgo: 50,
    },
  ],
  netherlands: [
    {
      title: "Starting midfielder fatigue being managed",
      summary:
        "A starting midfielder's workload is being managed due to fatigue from a congested club schedule; availability expected but monitored.",
      category: "form",
      impactLevel: "medium",
      direction: "negative",
      affectedPlayers: ["starting midfielder"],
      hoursAgo: 24,
    },
    {
      title: "Coach announces no fresh injury concerns",
      summary:
        "The head coach announced there are no fresh injury concerns following the latest session, a positive sign for selection.",
      category: "coach",
      impactLevel: "low",
      direction: "positive",
      affectedPlayers: [],
      hoursAgo: 38,
    },
  ],
};

/** Materialise the demo templates for a team into dated TeamNewsItems. */
export function getDemoNews(team: string): TeamNewsItem[] {
  const templates = DEMO[team];
  if (!templates) return [];
  const now = Date.now();
  return templates.map((t) => {
    const publishedAt = new Date(now - t.hoursAgo * 3600 * 1000);
    return {
      team,
      title: t.title,
      summary: t.summary,
      category: t.category,
      impactLevel: t.impactLevel,
      affectedPlayers: t.affectedPlayers,
      sourceName: "Demo news data",
      sourceUrl: "",
      publishedAt,
      createdAt: new Date(now),
      direction: t.direction,
      demo: true,
    } satisfies TeamNewsItem;
  });
}

export function hasDemoNews(team: string): boolean {
  return Boolean(DEMO[team]);
}
