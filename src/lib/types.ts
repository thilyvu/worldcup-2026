export type Round = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export const ROUND_LABEL: Record<Round, string> = {
  group: "Vòng bảng",
  r32: "Vòng 1/32",
  r16: "Vòng 1/16",
  qf: "Tứ kết",
  sf: "Bán kết",
  third: "Tranh hạng 3",
  final: "Chung kết",
};

export const ROUND_ORDER: Round[] = ["group", "r32", "r16", "qf", "sf", "third", "final"];

export type Pick = "team1" | "team2" | "draw";

export type Match = {
  id: string;
  round: Round;
  group_name: string | null;
  ordinal: number;
  kickoff: string | null;
  team1: string;
  team2: string;
  points: number;
  score1: number | null;
  score2: number | null;
  result: Pick | null;
  status: string;
};

export type Player = {
  id: string;
  name: string;
  is_admin: boolean;
};

export function isLocked(m: Match): boolean {
  if (m.status === "finished") return true;
  if (m.kickoff && new Date(m.kickoff).getTime() <= Date.now() + 2 * 60 * 60 * 1000) return true;
  return false;
}

export function pickLabel(m: Match, pick: Pick): string {
  if (pick === "team1") return m.team1;
  if (pick === "team2") return m.team2;
  return "Hòa";
}
