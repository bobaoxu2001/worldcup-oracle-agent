/**
 * One-off MongoDB Atlas setup for WorldCup Oracle Agent.
 *
 * Connects using MONGODB_URI from the environment (NEVER hard-coded), ensures the
 * `predictions` and `team_news` collections + their indexes exist, and — only if
 * `team_news` is empty — seeds clearly-labelled demo signals (`demo: true`).
 *
 * Security: the connection string is read from the environment only and is masked
 * in all output. Do NOT pass it on the command line in a way that gets logged.
 *
 * Usage (string stays out of shell history if you keep it in a gitignored file):
 *   MONGODB_URI="...your atlas uri..." MONGODB_DB=worldcup_oracle \
 *     npx tsx scripts/setup-mongo.ts
 *   # or:  npm run setup:mongo   (after exporting MONGODB_URI)
 */

import { MongoClient } from "mongodb";
import { getDemoNews, TRACKED_TEAMS } from "@/lib/news/demoNews";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "worldcup_oracle";

if (!uri) {
  console.error("✗ MONGODB_URI is not set. Export it first (do not commit it).");
  process.exit(1);
}

/** Mask credentials so the connection string is never printed in full. */
function maskUri(u: string): string {
  try {
    const x = new URL(u);
    if (x.username) x.username = x.username.slice(0, 2) + "***";
    if (x.password) x.password = "***";
    return `${x.protocol}//${x.username}${x.password ? ":" + x.password : ""}@${x.host}${x.pathname}`;
  } catch {
    return "(unparseable connection string)";
  }
}

async function main() {
  const client = new MongoClient(uri!, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(dbName);
  await db.command({ ping: 1 });
  console.log(`✓ Connected to "${db.databaseName}" via ${maskUri(uri!)}`);

  // predictions — agent session memory
  const predictions = db.collection("predictions");
  await predictions.createIndexes([
    { key: { createdAt: -1 }, name: "createdAt_-1" },
    { key: { teams: 1 }, name: "teams_1" },
    { key: { intent: 1 }, name: "intent_1" },
  ]);

  // team_news — daily news intelligence signals
  const teamNews = db.collection("team_news");
  await teamNews.createIndexes([
    { key: { team: 1, publishedAt: -1 }, name: "team_publishedAt" },
    { key: { category: 1 }, name: "category_1" },
    { key: { impactLevel: 1 }, name: "impactLevel_1" },
    { key: { demo: 1 }, name: "demo_1" },
  ]);

  // optional safe seed: only when team_news is empty (keeps demo:true honest)
  const existing = await teamNews.estimatedDocumentCount();
  if (existing === 0) {
    let seeded = 0;
    for (const team of TRACKED_TEAMS) {
      const items = getDemoNews(team);
      if (items.length) {
        await teamNews.insertMany(items);
        seeded += items.length;
      }
    }
    console.log(`✓ Seeded ${seeded} demo team_news signals (demo: true).`);
  } else {
    console.log(`• team_news already has ${existing} items — skipping seed.`);
  }

  const pIdx = (await predictions.indexes()).map((i) => i.name).join(", ");
  const nIdx = (await teamNews.indexes()).map((i) => i.name).join(", ");
  console.log(`✓ predictions indexes: ${pIdx}`);
  console.log(`✓ team_news indexes:   ${nIdx}`);
  console.log(`• predictions docs: ${await predictions.estimatedDocumentCount()}`);
  console.log(`• team_news docs:   ${await teamNews.estimatedDocumentCount()}`);

  await client.close();
  console.log("✓ MongoDB Atlas setup complete.");
}

main().catch((err) => {
  console.error("✗ Setup failed:", (err as Error)?.message);
  process.exit(1);
});
