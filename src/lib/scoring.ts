import { ROUND_LABEL, ROUND_ORDER, type Match, type Player, type Round } from "./types";
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

  // map match_id -> set of player_ids who predicted
  const predictedBy = new Map<string, Set<string>>();
  for (const pr of preds) {
    if (!predictedBy.has(pr.match_id)) predictedBy.set(pr.match_id, new Set());
    predictedBy.get(pr.match_id)!.add(pr.player_id);
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

  // players who didn't predict a finished match lose automatically
  for (const m of matches) {
    if (m.status !== "finished" || !m.result) continue;
    const amt = m.round === "group" ? groupPenalty : m.points;
    const predicted = predictedBy.get(m.id) ?? new Set();
    for (const row of base.values()) {
      if (!predicted.has(row.player.id)) {
        row.played += 1;
        row.penalty += amt;
        row.balance -= amt;
      }
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
      a.balance - b.balance ||
      b.penalty - a.penalty ||
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

export type RoundStat = {
  player: Player;
  correct: number;
  played: number;
  penalty: number;
  balance: number;
};

export type PerRoundData = {
  round: Round;
  label: string;
  stats: RoundStat[];
};

export async function computePerRoundStats(): Promise<PerRoundData[]> {
  const [players, matches, preds, settings] = await Promise.all([
    getPlayers(),
    getMatches(),
    getAllPredictions(),
    getSettings(),
  ]);

  const groupPenalty = settings.group_penalty ?? 5;
  const matchById = new Map<string, Match>(matches.map((m) => [m.id, m]));

  const roundData = new Map<Round, Map<string, RoundStat>>();
  for (const round of ROUND_ORDER) {
    const pm = new Map<string, RoundStat>();
    for (const p of players)
      pm.set(p.id, { player: p, correct: 0, played: 0, penalty: 0, balance: 0 });
    roundData.set(round, pm);
  }

  const predictedBy = new Map<string, Set<string>>();
  for (const pr of preds) {
    if (!predictedBy.has(pr.match_id)) predictedBy.set(pr.match_id, new Set());
    predictedBy.get(pr.match_id)!.add(pr.player_id);
  }

  for (const pr of preds) {
    const m = matchById.get(pr.match_id);
    if (!m || m.status !== "finished" || !m.result) continue;
    const stat = roundData.get(m.round)?.get(pr.player_id);
    if (!stat) continue;
    stat.played += 1;
    if (pr.pick === m.result) {
      stat.correct += 1;
    } else {
      const amt = m.round === "group" ? groupPenalty : m.points;
      stat.penalty += amt;
      stat.balance -= amt;
    }
  }

  for (const m of matches) {
    if (m.status !== "finished" || !m.result) continue;
    const amt = m.round === "group" ? groupPenalty : m.points;
    const predicted = predictedBy.get(m.id) ?? new Set();
    const roundMap = roundData.get(m.round);
    if (!roundMap) continue;
    for (const stat of roundMap.values()) {
      if (!predicted.has(stat.player.id)) {
        stat.played += 1;
        stat.penalty += amt;
        stat.balance -= amt;
      }
    }
  }

  const result: PerRoundData[] = [];
  for (const round of ROUND_ORDER) {
    const pm = roundData.get(round)!;
    const stats = [...pm.values()];
    if (stats.every((s) => s.played === 0)) continue;
    stats.sort((a, b) => a.balance - b.balance || a.player.name.localeCompare(b.player.name));
    result.push({ round, label: ROUND_LABEL[round], stats });
  }
  return result;
}
