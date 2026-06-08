import { MongoClient, ObjectId } from "mongodb";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

const uri = process.env.DATABASE_URL;
const DB_NAME = "worldcup2026";

const g = globalThis as typeof globalThis & { _mongo?: MongoClient };
if (!g._mongo) g._mongo = new MongoClient(uri);
export const mongoClient = g._mongo;

export async function getDb() {
  return mongoClient.db(DB_NAME);
}

export { ObjectId };
