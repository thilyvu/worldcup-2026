// Creates indexes in MongoDB. Safe to re-run (idempotent).
// npm run db:init
import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL;
if (!uri) { console.error("DATABASE_URL not set"); process.exit(1); }

const client = new MongoClient(uri);
const db = client.db("worldcup2026");

try {
  await db.collection("players").createIndex({ name: 1 }, { unique: true });
  await db.collection("matches").createIndex({ round: 1, ordinal: 1 });
  await db.collection("predictions").createIndex(
    { player_id: 1, match_id: 1 },
    { unique: true }
  );
  await db.collection("champion_picks").createIndex({ player_id: 1 }, { unique: true });
  console.log("✓ Indexes created.");
} finally {
  await client.close();
}
