import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDb } from "@/lib/db";
import type { Pick } from "@/lib/types";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key chưa cấu hình" }, { status: 500 });

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": apiKey }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: `API lỗi: ${res.status}` }, { status: 502 });

  const data = await res.json() as {
    matches: Array<{
      utcDate: string;
      homeTeam: { name: string };
      awayTeam: { name: string };
      score: { fullTime: { home: number | null; away: number | null } };
    }>;
  };

  const db = await getDb();
  const col = db.collection("matches");

  let updated = 0;
  const notFound: string[] = [];

  for (const am of data.matches) {
    const { home, away } = am.score.fullTime;
    if (home === null || away === null) continue;

    const kickoffUTC = new Date(am.utcDate);
    const from = new Date(kickoffUTC.getTime() - 5 * 60 * 1000);
    const to   = new Date(kickoffUTC.getTime() + 5 * 60 * 1000);

    const score1 = home;
    const score2 = away;
    const result: Pick = score1 > score2 ? "team1" : score1 < score2 ? "team2" : "draw";

    const r = await col.updateOne(
      { kickoff: { $gte: from, $lte: to } },
      { $set: { score1, score2, result, status: "finished" } }
    );

    if (r.matchedCount > 0) updated++;
    else notFound.push(`${am.homeTeam.name} vs ${am.awayTeam.name}`);
  }

  if (updated > 0) {
    revalidateTag("matches");
    revalidateTag("predictions");
    revalidatePath("/");
    revalidatePath("/matches");
    revalidatePath("/groups");
    revalidatePath("/admin");
  }

  return NextResponse.json({ updated, notFound });
}
