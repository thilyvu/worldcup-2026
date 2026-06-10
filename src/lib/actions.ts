"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { getDb, ObjectId } from "./db";
import {
  createSession,
  destroySession,
  requireAdmin,
  requirePlayer,
} from "./auth";
import type { Pick } from "./types";
import { getMatch, getSettings, getPlayerByName } from "./queries";

// ---- Auth ----------------------------------------------------------------

export async function loginAction(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const pin = String(formData.get("pin") || "");

  if (!name) return { error: "Hãy chọn tên của bạn." };
  if (pin.length < 4) return { error: "PIN phải có ít nhất 4 ký tự." };

  const player = await getPlayerByName(name);
  if (!player) return { error: "Không tìm thấy người chơi này." };

  const db = await getDb();
  const col = db.collection<{ _id: ObjectId; pin_hash: string | null }>("players");

  if (!player.pin_hash) {
    // First login: set PIN.
    const hash = await bcrypt.hash(pin, 10);
    await col.updateOne({ _id: new ObjectId(player.id) }, { $set: { pin_hash: hash } });
  } else {
    const ok = await bcrypt.compare(pin, player.pin_hash);
    if (!ok) return { error: "Sai PIN." };
  }

  await createSession({ id: player.id, name: player.name, is_admin: player.is_admin });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ---- Predictions ---------------------------------------------------------

export async function savePredictionAction(formData: FormData) {
  const player = await requirePlayer();
  const matchId = String(formData.get("matchId"));
  const pick = String(formData.get("pick")) as Pick;

  if (!["team1", "team2", "draw"].includes(pick)) return;

  const match = await getMatch(matchId);
  if (!match) return;

  if (match.round !== "group" && pick === "draw") return;

  const locked =
    match.status === "finished" ||
    (match.kickoff && new Date(match.kickoff).getTime() <= Date.now());
  if (locked) return;

  const db = await getDb();
  await db.collection("predictions").updateOne(
    { player_id: new ObjectId(player.id), match_id: new ObjectId(matchId) },
    { $set: { pick, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
    { upsert: true }
  );

  revalidateTag("predictions");
  revalidatePath("/predict");
  revalidatePath("/");
}

export async function saveChampionAction(formData: FormData) {
  const player = await requirePlayer();
  const team = String(formData.get("team") || "").trim();
  if (!team) return;

  const settings = await getSettings();
  if (
    settings.champion_lock &&
    new Date(settings.champion_lock).getTime() <= Date.now()
  )
    return;

  const db = await getDb();
  await db.collection("champion_picks").updateOne(
    { player_id: new ObjectId(player.id) },
    { $set: { team, points: 50, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
    { upsert: true }
  );

  revalidateTag("champion_picks");
  revalidatePath("/champion");
  revalidatePath("/");
}

// ---- Admin ---------------------------------------------------------------

export async function setResultAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  const s1raw = formData.get("score1");
  const s2raw = formData.get("score2");

  const db = await getDb();
  const col = db.collection("matches");
  const oid = new ObjectId(matchId);

  if (s1raw === "" || s2raw === "" || s1raw == null || s2raw == null) {
    await col.updateOne(
      { _id: oid },
      { $set: { score1: null, score2: null, result: null, status: "scheduled" } }
    );
  } else {
    const score1 = Number(s1raw);
    const score2 = Number(s2raw);
    const result: Pick =
      score1 > score2 ? "team1" : score1 < score2 ? "team2" : "draw";
    await col.updateOne(
      { _id: oid },
      { $set: { score1, score2, result, status: "finished" } }
    );
  }

  revalidateTag("matches");
  revalidateTag("predictions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/groups");
  revalidatePath("/matches");
}

export async function setTeamsAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  const team1 = String(formData.get("team1") || "").trim();
  const team2 = String(formData.get("team2") || "").trim();
  if (!team1 || !team2) return;

  const db = await getDb();
  await db.collection("matches").updateOne(
    { _id: new ObjectId(matchId) },
    { $set: { team1, team2 } }
  );

  revalidateTag("matches");
  revalidatePath("/admin");
  revalidatePath("/matches");
  revalidatePath("/predict");
}

export async function setChampionAction(formData: FormData) {
  await requireAdmin();
  const champion = String(formData.get("champion") || "").trim();
  const db = await getDb();
  await db
    .collection("settings")
    .updateOne({}, { $set: { champion: champion || null } }, { upsert: true });

  revalidateTag("settings");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setGroupPenaltyAction(formData: FormData) {
  await requireAdmin();
  const val = Number(formData.get("group_penalty"));
  if (!Number.isFinite(val) || val < 0) return;
  const db = await getDb();
  await db
    .collection("settings")
    .updateOne({}, { $set: { group_penalty: val } }, { upsert: true });

  revalidateTag("settings");
  revalidatePath("/admin");
  revalidatePath("/");
}
