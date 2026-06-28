import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { Pick } from "@/lib/types";

// Team names as returned by football-data.org that differ from our seed names.
// Keys are lowercased API names; values are the canonical seed name.
const ALIAS: Record<string, string> = {
  "united states": "USA",
  "turkey": "Turkiye",
  "congo dr": "DR Congo",
  "cape verde islands": "Cape Verde",
};

// Strip diacritics + non-letters for tolerant comparison ("Curaçao" === "Curacao").
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
}

// Map an API team name to its canonical seed name (for storing into the DB).
function aliasName(name: string): string {
  return ALIAS[name.toLowerCase()] ?? name;
}

// Normalised key for matching an API name against a stored team name.
function canon(name: string): string {
  return norm(aliasName(name));
}

type ApiMatch = {
  utcDate: string;
  stage: string;
  status: string;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: string;
    fullTime: { home: number | null; away: number | null };
  };
};

type MatchDoc = {
  _id: ObjectId;
  round: string;
  kickoff: Date | null;
  team1: string;
  team2: string;
  status: string;
  score1: number | null;
  score2: number | null;
  result: Pick | null;
};

// football-data.org stage → our round key.
const STAGE_TO_ROUND: Record<string, string> = {
  GROUP_STAGE: "group",
  LAST_32: "r32",
  LAST_16: "r16",
  QUARTER_FINALS: "qf",
  SEMI_FINALS: "sf",
  THIRD_PLACE: "third",
  FINAL: "final",
};

export async function GET(req: Request) {
  // Fail-closed: this endpoint is only ever called by the external scheduler.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET chưa cấu hình" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key chưa cấu hình" }, { status: 500 });

  const db = await getDb();
  const col = db.collection<MatchDoc>("matches");

  try {
    // Pull ALL matches (not just FINISHED) so knockout team names can be filled
    // in as soon as the bracket advances, letting players predict in time.
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches",
      { headers: { "X-Auth-Token": apiKey }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`API lỗi: ${res.status}`);

    const data = (await res.json()) as { matches: ApiMatch[] };
    const docs = await col.find({}).toArray();

    let updated = 0;       // matches whose result was filled in this run
    let teamsFilled = 0;   // knockout matches whose teams were filled in this run
    let changed = false;   // any write happened (incl. kickoff refresh) → revalidate
    const notFound: string[] = [];

    for (const am of data.matches) {
      const round = STAGE_TO_ROUND[am.stage];
      if (!round) continue; // unknown stage we don't track

      const apiHome = am.homeTeam?.name;
      const apiAway = am.awayTeam?.name;
      // Skip if both teams are unknown — nothing to do yet.
      if (!apiHome && !apiAway) continue;

      const h = apiHome ? canon(apiHome) : null;
      const a = apiAway ? canon(apiAway) : null;

      // 1) Find the DB slot for this API match.
      //    - Both teams known: exact pair match, OR a half-filled slot containing either team.
      //    - One team known: half-filled slot containing that team, or a fully-empty TBD/TBD slot.
      let target = docs.find((d) => {
        if (d.round !== round) return false;
        const t1 = norm(d.team1);
        const t2 = norm(d.team2);
        if (h && a) {
          if ((t1 === h && t2 === a) || (t1 === a && t2 === h)) return true;
          // Slot partially filled from a previous sync run — one side still TBD.
          if ((t1 === h || t1 === a) && d.team2 === "TBD") return true;
          if ((t2 === h || t2 === a) && d.team1 === "TBD") return true;
          return false;
        }
        if (h) return (t1 === h && d.team2 === "TBD") || (t2 === h && d.team1 === "TBD");
        if (a) return (t1 === a && d.team2 === "TBD") || (t2 === a && d.team1 === "TBD");
        return false;
      });

      // 2) No match → claim the first fully-empty (TBD/TBD) slot for this round.
      if (!target && round !== "group") {
        target = docs.find((d) => d.round === round && d.team1 === "TBD" && d.team2 === "TBD");
      }

      if (!target) {
        if (apiHome || apiAway) notFound.push(`${apiHome ?? "TBD"} vs ${apiAway ?? "TBD"} (${am.stage})`);
        continue;
      }

      const set: Partial<MatchDoc> = {};

      // Fill team slots independently so partial matches (one team still null) are
      // handled in two passes: fill the known side now, fill the other side next sync.
      if (target.round !== "group") {
        const existT1 = target.team1 !== "TBD" ? norm(target.team1) : null;
        const existT2 = target.team2 !== "TBD" ? norm(target.team2) : null;

        if (target.team1 === "TBD") {
          // Fill team1 with whichever API team is not already occupying team2.
          const fill = (apiHome && existT2 !== h) ? apiHome
                     : (apiAway && existT2 !== a) ? apiAway
                     : null;
          if (fill) { set.team1 = aliasName(fill); target.team1 = set.team1; teamsFilled++; }
        }
        if (target.team2 === "TBD") {
          const t1Final = set.team1 ? norm(set.team1) : existT1;
          // Fill team2 with whichever API team is not already occupying team1.
          const fill = (apiAway && t1Final !== a) ? apiAway
                     : (apiHome && t1Final !== h) ? apiHome
                     : null;
          if (fill) { set.team2 = aliasName(fill); target.team2 = set.team2; teamsFilled++; }
        }
      }

      // Keep kickoff in sync with the official schedule (seed times are unreliable),
      // so prediction locking happens at the right moment.
      const apiKickoff = new Date(am.utcDate);
      if (!target.kickoff || target.kickoff.getTime() !== apiKickoff.getTime()) {
        set.kickoff = apiKickoff;
      }

      // Fill the result once, only when finished and not already finished by us/admin.
      if (am.status === "FINISHED" && target.status !== "finished") {
        const fh = am.score.fullTime.home;
        const fa = am.score.fullTime.away;
        if (fh !== null && fa !== null && apiHome && apiAway) {
          const t1 = set.team1 ?? target.team1;
          const t2 = set.team2 ?? target.team2;
          // Map API home/away onto team1/team2 by name (robust to ordering).
          const homeIsTeam1 = canon(apiHome) === norm(t1);
          const s1 = homeIsTeam1 ? fh : fa;
          const s2 = homeIsTeam1 ? fa : fh;

          let result: Pick | null;
          if (target.round === "group") {
            result = s1 > s2 ? "team1" : s1 < s2 ? "team2" : "draw";
          } else {
            // Knockout: the advancing side wins on penalties/ET — use score.winner.
            const winnerName =
              am.score.winner === "HOME_TEAM" ? apiHome :
              am.score.winner === "AWAY_TEAM" ? apiAway : null;
            const w = winnerName ? canon(winnerName) : null;
            result = w && norm(t1) === w ? "team1" : w && norm(t2) === w ? "team2" : null;
          }

          if (result) {
            set.score1 = s1;
            set.score2 = s2;
            set.result = result;
            set.status = "finished";
            updated++;
          }
        }
      }

      if (Object.keys(set).length > 0) {
        await col.updateOne({ _id: target._id }, { $set: set });
        changed = true;
      }
    }

    if (changed) {
      revalidateTag("matches");
      revalidateTag("predictions");
      revalidatePath("/");
      revalidatePath("/matches");
      revalidatePath("/groups");
      revalidatePath("/predict");
      revalidatePath("/admin");
    }

    await db.collection("settings").updateOne(
      {},
      {
        $set: {
          last_sync_at: new Date(),
          last_updated_count: updated,
          last_teams_filled: teamsFilled,
          last_not_found: notFound,
          last_error: null,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ updated, teamsFilled, notFound });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.collection("settings").updateOne(
      {},
      { $set: { last_sync_at: new Date(), last_error: message } },
      { upsert: true }
    );
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
