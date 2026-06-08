// Seeds players and the full fixture list from seed.data.json.
// Idempotent: clears matches and re-inserts. Players are upserted by name.
// npm run db:seed
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL;
if (!uri) { console.error("DATABASE_URL not set"); process.exit(1); }

const __dirname = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(
  readFileSync(join(__dirname, "..", "seed.data.json"), "utf8")
) as {
  players: string[];
  groups: Record<string, string[]>;
  teamList: string[];
  championPoints: number;
  groupStage: { round: string; group: string; date: string; team1: string; team2: string; points: number }[];
  knockout: { round: string; slot: number; date: string; team1: string; team2: string; points: number }[];
};

const TZ = "+07:00";

function parseKickoff(raw: string): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, hh, mi] = m;
    return new Date(
      `2026-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}T${hh.padStart(2,"0")}:${mi}:00${TZ}`
    );
  }
  const num = Number(s);
  if (!Number.isNaN(num) && num > 40000) {
    const ms = Math.round((num - 25569) * 86400 * 1000);
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2,"0");
    return new Date(
      `2026-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00${TZ}`
    );
  }
  return null;
}

const client = new MongoClient(uri);
const db = client.db("worldcup2026");

try {
  // Create indexes first.
  await db.collection("players").createIndex({ name: 1 }, { unique: true });
  await db.collection("predictions").createIndex({ player_id: 1, match_id: 1 }, { unique: true });
  await db.collection("champion_picks").createIndex({ player_id: 1 }, { unique: true });

  // Players — first is admin.
  for (let i = 0; i < seed.players.length; i++) {
    await db.collection("players").updateOne(
      { name: seed.players[i] },
      { $setOnInsert: { name: seed.players[i], pin_hash: null, is_admin: i === 0 } },
      { upsert: true }
    );
  }

  // Wipe and reload matches so re-seeding is safe.
  await db.collection("matches").deleteMany({});

  // Group stage.
  let ordGroup = 0;
  for (const m of seed.groupStage) {
    await db.collection("matches").insertOne({
      round: "group",
      group_name: m.group,
      ordinal: ordGroup++,
      kickoff: parseKickoff(m.date),
      team1: m.team1,
      team2: m.team2,
      points: m.points,
      score1: null,
      score2: null,
      result: null,
      status: "scheduled",
    });
  }

  // Knockout.
  for (const m of seed.knockout) {
    await db.collection("matches").insertOne({
      round: m.round,
      group_name: null,
      ordinal: m.slot,
      kickoff: parseKickoff(m.date),
      team1: m.team1,
      team2: m.team2,
      points: m.points,
      score1: null,
      score2: null,
      result: null,
      status: "scheduled",
    });
  }

  // Settings: champion_lock = kickoff of first QF match.
  const firstQF = await db.collection("matches")
    .findOne({ round: "qf" }, { sort: { ordinal: 1 } });
  await db.collection("settings").updateOne(
    {},
    {
      $set: {
        champion: null,
        champion_lock: firstQF?.kickoff ?? null,
      },
    },
    { upsert: true }
  );

  // Stats.
  const rounds = ["group","r32","r16","qf","sf","final"];
  for (const r of rounds) {
    const n = await db.collection("matches").countDocuments({ round: r });
    if (n) console.log(`  ${r}: ${n} matches`);
  }
  console.log("✓ Seeded", seed.players.length, "players");
  console.log("✓ champion_lock:", firstQF?.kickoff);
} catch(e) {
  console.error("Seed failed:", e);
  process.exitCode = 1;
} finally {
  await client.close();
}
