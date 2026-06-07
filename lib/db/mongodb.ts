/**
 * MongoDB memory layer — the agent's "remember what I predicted" step.
 *
 * Targets the MongoDB Partner Track. Every prediction interaction is persisted
 * so the agent has a memory of past sessions (the "Recent Predictions" rail).
 *
 * CRITICAL DEMO GUARANTEE: if MONGODB_URI is missing, invalid, or unreachable,
 * we transparently fall back to an in-process memory store. The app NEVER
 * crashes or blocks on the database — Mongo is an enhancement, not a dependency.
 */

import { MongoClient, type Collection, type Db } from "mongodb";

export interface StoredPrediction {
  userQuery: string;
  intent: string;
  teams: string[];
  prediction: {
    teamAWin: number;
    draw: number;
    teamBWin: number;
    confidence: number;
  } | null;
  simulationResult: {
    simulationsRun: number;
    mostLikelyScore: string;
    upsetProbability: number;
    summary: string;
  } | null;
  reasoningSteps: string[];
  explanation: string;
  followUpContext: string;
  createdAt: Date;
}

export type PersistMode = "mongodb" | "memory";

const DB_NAME = process.env.MONGODB_DB || "worldcup_oracle";
const COLLECTION = "predictions";

// ---- In-memory fallback store (survives within a single server process) ----
const memoryStore: StoredPrediction[] = [];
const MEMORY_LIMIT = 50;

// ---- Mongo connection (lazy, cached, fail-soft) ----
let clientPromise: Promise<MongoClient> | null = null;
let mongoUnavailable = false;

function getClient(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI;
  if (!uri || mongoUnavailable) return null;
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });
    clientPromise = client.connect().catch((err) => {
      console.warn("[mongodb] connection failed — using in-memory fallback:", err?.message);
      mongoUnavailable = true;
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export function mongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI) && !mongoUnavailable;
}

/**
 * Shared DB handle for other collections (e.g. team_news) to reuse the same
 * pooled, fail-soft connection. Returns null when Mongo is absent/unreachable.
 */
export async function getMongoDb(): Promise<Db | null> {
  const cp = getClient();
  if (!cp) return null;
  try {
    const client = await cp;
    return client.db(DB_NAME);
  } catch {
    return null;
  }
}

async function getCollection(): Promise<Collection<StoredPrediction> | null> {
  const cp = getClient();
  if (!cp) return null;
  try {
    const client = await cp;
    return client.db(DB_NAME).collection<StoredPrediction>(COLLECTION);
  } catch {
    return null;
  }
}

/** Persist a prediction. Returns which backend actually stored it. */
export async function savePrediction(doc: StoredPrediction): Promise<PersistMode> {
  const col = await getCollection();
  if (col) {
    try {
      await col.insertOne(doc);
      return "mongodb";
    } catch (err) {
      console.warn("[mongodb] insert failed — falling back to memory:", (err as Error)?.message);
    }
  }
  memoryStore.unshift(doc);
  if (memoryStore.length > MEMORY_LIMIT) memoryStore.length = MEMORY_LIMIT;
  return "memory";
}

/** Fetch recent predictions (newest first). Always returns something. */
export async function getRecentPredictions(limit = 8): Promise<{
  items: StoredPrediction[];
  source: PersistMode;
}> {
  const col = await getCollection();
  if (col) {
    try {
      const items = await col
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return { items, source: "mongodb" };
    } catch (err) {
      console.warn("[mongodb] query failed — falling back to memory:", (err as Error)?.message);
    }
  }
  return { items: memoryStore.slice(0, limit), source: "memory" };
}
