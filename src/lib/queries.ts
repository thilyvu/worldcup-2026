import { getDb, ObjectId } from "./db";
import type { Match, Player, Pick, Round } from "./types";

// ---- Document types (internal) ------------------------------------------

type PlayerDoc = {
  _id: ObjectId;
  name: string;
  pin_hash: string | null;
  is_admin: boolean;
};

type MatchDoc = {
  _id: ObjectId;
  round: string;
  group_name: string | null;
  ordinal: number;
  kickoff: Date | null;
  team1: string;
  team2: string;
  points: number;
  score1: number | null;
  score2: number | null;
  result: Pick | null;
  status: string;
};

type PredictionDoc = {
  _id: ObjectId;
  player_id: ObjectId;
  match_id: ObjectId;
  pick: Pick;
};

type ChampionDoc = {
  _id: ObjectId;
  player_id: ObjectId;
  team: string;
  points: number;
};

type SettingsDoc = {
  _id: ObjectId;
  champion: string | null;
  champion_lock: Date | null;
};

// ---- Converters ----------------------------------------------------------

function toPlayer(d: PlayerDoc): Player {
  return { id: d._id.toString(), name: d.name, is_admin: d.is_admin };
}

function toMatch(d: MatchDoc): Match {
  return {
    id: d._id.toString(),
    round: d.round as Round,
    group_name: d.group_name,
    ordinal: d.ordinal,
    kickoff: d.kickoff ? d.kickoff.toISOString() : null,
    team1: d.team1,
    team2: d.team2,
    points: d.points,
    score1: d.score1 ?? null,
    score2: d.score2 ?? null,
    result: d.result ?? null,
    status: d.status,
  };
}

// ---- Collections helpers -------------------------------------------------

async function col<T extends object>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

// ---- Players -------------------------------------------------------------

export async function getPlayers(): Promise<Player[]> {
  const c = await col<PlayerDoc>("players");
  const docs = await c.find().sort({ name: 1 }).toArray();
  return docs.map(toPlayer);
}

export async function getPlayerByName(name: string): Promise<
  (Player & { pin_hash: string | null }) | null
> {
  const c = await col<PlayerDoc>("players");
  const d = await c.findOne({ name });
  if (!d) return null;
  return { ...toPlayer(d), pin_hash: d.pin_hash };
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const c = await col<PlayerDoc>("players");
  const d = await c.findOne({ _id: new ObjectId(id) });
  return d ? toPlayer(d) : null;
}

// ---- Matches -------------------------------------------------------------

export async function getMatches(round?: Round): Promise<Match[]> {
  const c = await col<MatchDoc>("matches");
  const roundOrder = ["group", "r32", "r16", "qf", "sf", "final"];
  const filter = round ? { round } : {};
  const docs = await c.find(filter).sort({ ordinal: 1 }).toArray();
  if (!round) {
    docs.sort(
      (a, b) =>
        roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round) ||
        a.ordinal - b.ordinal
    );
  }
  return docs.map(toMatch);
}

export async function getMatch(id: string): Promise<Match | null> {
  const c = await col<MatchDoc>("matches");
  const d = await c.findOne({ _id: new ObjectId(id) });
  return d ? toMatch(d) : null;
}

// ---- Predictions ---------------------------------------------------------

export type PredictionRow = {
  player_id: string;
  match_id: string;
  pick: Pick;
};

export async function getPredictionsForPlayer(
  playerId: string
): Promise<Map<string, Pick>> {
  const c = await col<PredictionDoc>("predictions");
  const docs = await c.find({ player_id: new ObjectId(playerId) }).toArray();
  const map = new Map<string, Pick>();
  for (const d of docs) map.set(d.match_id.toString(), d.pick);
  return map;
}

export async function getAllPredictions(): Promise<PredictionRow[]> {
  const c = await col<PredictionDoc>("predictions");
  const docs = await c.find().toArray();
  return docs.map((d) => ({
    player_id: d.player_id.toString(),
    match_id: d.match_id.toString(),
    pick: d.pick,
  }));
}

// ---- Champion picks ------------------------------------------------------

export type ChampionPick = { player_id: string; team: string; points: number };

export async function getChampionPicks(): Promise<ChampionPick[]> {
  const c = await col<ChampionDoc>("champion_picks");
  const docs = await c.find().toArray();
  return docs.map((d) => ({
    player_id: d.player_id.toString(),
    team: d.team,
    points: d.points,
  }));
}

export async function getChampionPickForPlayer(
  playerId: string
): Promise<string | null> {
  const c = await col<ChampionDoc>("champion_picks");
  const d = await c.findOne({ player_id: new ObjectId(playerId) });
  return d?.team ?? null;
}

// ---- Settings ------------------------------------------------------------

export type Settings = {
  champion: string | null;
  champion_lock: string | null;
};

export async function getSettings(): Promise<Settings> {
  const c = await col<SettingsDoc>("settings");
  const d = await c.findOne({});
  return {
    champion: d?.champion ?? null,
    champion_lock: d?.champion_lock?.toISOString() ?? null,
  };
}
