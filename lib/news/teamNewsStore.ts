/**
 * Team News Store — persistence for the news intelligence layer.
 *
 * Primary: MongoDB `team_news` collection (MongoDB Partner Track), indexed on
 * team / publishedAt / category / impactLevel. Fallback: an in-process memory
 * store. As everywhere in this app, MongoDB is an enhancement — if it is
 * missing or unreachable, news still works and predictions never break.
 */

import { getMongoDb } from "@/lib/db/mongodb";
import type { Collection } from "mongodb";
import type { TeamNewsItem } from "./types";

const COLLECTION = "team_news";

// ---- In-memory fallback (per server process) ----
const memoryStore: TeamNewsItem[] = [];
const MEMORY_LIMIT = 500;

let indexesEnsured = false;

async function getCollection(): Promise<Collection<TeamNewsItem> | null> {
  const db = await getMongoDb();
  if (!db) return null;
  const col = db.collection<TeamNewsItem>(COLLECTION);
  if (!indexesEnsured) {
    try {
      await col.createIndexes([
        { key: { team: 1, publishedAt: -1 }, name: "team_publishedAt" },
        { key: { category: 1 }, name: "category" },
        { key: { impactLevel: 1 }, name: "impactLevel" },
        { key: { publishedAt: -1 }, name: "publishedAt" },
      ]);
      indexesEnsured = true;
    } catch {
      /* indexes are best-effort */
    }
  }
  return col;
}

/** A stable key to de-duplicate news items (same team + title). */
function keyOf(it: TeamNewsItem): string {
  return `${it.team}::${it.title.trim().toLowerCase()}`;
}

/**
 * Upsert a batch of news items for a team. Replaces the team's prior items so
 * a refresh produces a clean, current set. Returns the backend used.
 */
export async function saveTeamNews(
  team: string,
  items: TeamNewsItem[]
): Promise<"mongodb" | "memory"> {
  const col = await getCollection();
  if (col) {
    try {
      await col.deleteMany({ team });
      if (items.length) await col.insertMany(items);
      return "mongodb";
    } catch (err) {
      console.warn("[team_news] write failed — using memory:", (err as Error)?.message);
    }
  }
  // memory fallback: drop prior items for the team, then add the new set
  for (let i = memoryStore.length - 1; i >= 0; i--) {
    if (memoryStore[i].team === team) memoryStore.splice(i, 1);
  }
  memoryStore.push(...items);
  if (memoryStore.length > MEMORY_LIMIT) memoryStore.splice(0, memoryStore.length - MEMORY_LIMIT);
  return "memory";
}

/** Recent news for a team, newest first. Always returns something usable. */
export async function getTeamNews(
  team: string,
  limit = 8
): Promise<{ items: TeamNewsItem[]; source: "mongodb" | "memory" }> {
  const col = await getCollection();
  if (col) {
    try {
      const items = await col
        .find({ team }, { projection: { _id: 0 } })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .toArray();
      return { items, source: "mongodb" };
    } catch (err) {
      console.warn("[team_news] query failed — using memory:", (err as Error)?.message);
    }
  }
  const items = memoryStore
    .filter((n) => n.team === team)
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
  return { items, source: "memory" };
}

/** True if the store already has any items for a team (in memory or Mongo). */
export async function hasStoredNews(team: string): Promise<boolean> {
  const col = await getCollection();
  if (col) {
    try {
      return (await col.countDocuments({ team }, { limit: 1 })) > 0;
    } catch {
      /* fall through to memory */
    }
  }
  return memoryStore.some((n) => n.team === team);
}

export { keyOf };
