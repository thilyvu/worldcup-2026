import type { Match, Player } from "./types";
import {
  getAllPredictions,
  getChampionPicks,
  getMatches,
  getPlayers,
  getSettings,
} from "./queries";

export type LeaderboardRow = {
  player: Player;
  balance: number;       // k VND: starts 0, wrong picks subtract, champion adds 100
  correct: number;
  played: number;
  penalty: number;       // total k VND lost (always >= 0)
  championBonus: number; // 0 or 100
  rank: number;
};

export async function computeLeaderboard(): Promise<LeaderboardRow[]> {
  const [players, matches, preds, champPicks, settings] = await Promise.all([
    getPlayers(),
    getMatches(),
    getAllPredictions(),
    getChampionPicks(),
    getSettings(),
  ]);

  const groupPenalty = settings.group_penalty ?? 5;
  const matchById = new Map<string, Match>(matches.map((m) => [m.id, m]));
  const base = new Map<string, LeaderboardRow>();
  for (const p of players) {
    base.set(p.id, { player: p, balance: 0, correct: 0, played: 0, penalty: 0, championBonus: 0, rank: 0 });
  }

  for (const pr of preds) {
    const m = matchById.get(pr.match_id);
    const row = base.get(pr.player_id);
    if (!m || !row) continue;
    if (m.status !== "finished" || !m.result) continue;
    row.played += 1;
    if (pr.pick === m.result) {
      row.correct += 1;
    } else {
      const amt = m.round === "group" ? groupPenalty : m.points;
      row.penalty += amt;
      row.balance -= amt;
    }
  }

  if (settings.champion) {
    for (const cp of champPicks) {
      const row = base.get(cp.player_id);
      if (row && cp.team === settings.champion) {
        row.championBonus = 100;
        row.balance += 100;
      }
    }
  }

  const rows = [...base.values()].sort(
    (a, b) =>
      b.balance - a.balance ||
      a.penalty - b.penalty ||
      a.player.name.localeCompare(b.player.name)
  );
  let rank = 0;
  let prev = Infinity;
  rows.forEach((r, i) => {
    if (r.balance !== prev) {
      rank = i + 1;
      prev = r.balance;
    }
    r.rank = rank;
  });
  return rows;
}

export type GroupStanding = {
  team: string;
  pl: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export function computeGroupStandings(
  matches: Match[]
): Map<string, GroupStanding[]> {
  const byGroup = new Map<string, Map<string, GroupStanding>>();

  const ensure = (group: string, team: string) => {
    if (!byGroup.has(group)) byGroup.set(group, new Map());
    const g = byGroup.get(group)!;
    if (!g.has(team))
      g.set(team, { team, pl: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    return g.get(team)!;
  };

  for (const m of matches) {
    if (m.round !== "group" || !m.group_name) continue;
    const a = ensure(m.group_name, m.team1);
    const b = ensure(m.group_name, m.team2);
    if (m.status !== "finished" || m.score1 == null || m.score2 == null) continue;
    a.pl++; b.pl++;
    a.gf += m.score1; a.ga += m.score2;
    b.gf += m.score2; b.ga += m.score1;
    if (m.score1 > m.score2) {
      a.w++; b.l++; a.pts += 3;
    } else if (m.score1 < m.score2) {
      b.w++; a.l++; b.pts += 3;
    } else {
      a.d++; b.d++; a.pts++; b.pts++;
    }
  }

  const out = new Map<string, GroupStanding[]>();
  for (const [group, teams] of byGroup) {
    const arr = [...teams.values()];
    arr.forEach((t) => (t.gd = t.gf - t.ga));
    arr.sort(
      (x, y) =>
        y.pts - x.pts ||
        y.gd - x.gd ||
        y.gf - x.gf ||
        x.team.localeCompare(y.team)
    );
    out.set(group, arr);
  }
  return new Map([...out.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}
