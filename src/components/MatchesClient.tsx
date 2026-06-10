"use client";

import { useState } from "react";
import { ROUND_LABEL, ROUND_ORDER, pickLabel, type Match, type Pick } from "@/lib/types";
import type { Player } from "@/lib/types";
import type { PredictionRow } from "@/lib/queries";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const PICK_COLORS: Record<Pick, string> = { team1: "#00E87A", draw: "#94a3b8", team2: "#4D9EFF" };
const PICK_BG: Record<Pick, string> = {
  team1: "rgba(0,232,122,0.08)", draw: "rgba(148,163,184,0.07)", team2: "rgba(77,158,255,0.08)",
};

export function MatchesClient({
  allMatches,
  preds,
  players,
  myId,
}: {
  allMatches: Match[];
  preds: PredictionRow[];
  players: Player[];
  myId: string;
}) {
  const [round, setRound] = useState<typeof ROUND_ORDER[number]>("group");

  const pickMap = new Map<string, Map<string, Pick>>();
  for (const p of preds) {
    if (!pickMap.has(p.match_id)) pickMap.set(p.match_id, new Map());
    pickMap.get(p.match_id)!.set(p.player_id, p.pick);
  }

  const matches = allMatches.filter(m => m.round === round);

  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    const k = m.group_name ?? `M${m.ordinal}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="anim-up">
        <p className="label" style={{ marginBottom: 6 }}>Dự đoán của nhóm</p>
        <h1 className="font-display" style={{ fontSize: "clamp(2.2rem,6vw,3.8rem)", lineHeight: 0.9, letterSpacing: "0.04em" }}>
          CÁC <span className="text-green-grad">TRẬN ĐẤU</span>
        </h1>
      </div>

      {/* Round tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ROUND_ORDER.map((r) => {
          const active = r === round;
          return (
            <button key={r} onClick={() => setRound(r)} style={{
              padding: "7px 14px", borderRadius: 9, fontSize: "0.78rem",
              fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer",
              transition: "all 0.15s", fontFamily: "var(--font-barlow)", border: "none",
              background: active ? "rgba(0,232,122,0.1)" : "rgba(255,255,255,0.025)",
              color: active ? "#00E87A" : "rgba(232,245,238,0.3)",
              outline: `1px solid ${active ? "rgba(0,232,122,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
              {ROUND_LABEL[r].toUpperCase()}
            </button>
          );
        })}
      </div>

      {[...groups.entries()].map(([group, groupMatches]) => (
        <div key={group}>
          {round === "group" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div className="g-badge">{group}</div>
              <span className="label">Bảng {group}</span>
            </div>
          )}
          <div className="glass">
            {groupMatches.map((m, mi) => {
              const picks = pickMap.get(m.id) ?? new Map<string, Pick>();
              const hasScore = m.status === "finished" && m.score1 != null;
              const counts: Record<Pick, number> = { team1: 0, draw: 0, team2: 0 };
              for (const [, p] of picks) counts[p]++;
              const total = picks.size;

              return (
                <div key={m.id} style={{
                  padding: "14px 18px",
                  borderBottom: mi < groupMatches.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.team1}</span>
                    {hasScore ? (
                      <span className="score-badge">{m.score1} – {m.score2}</span>
                    ) : (
                      <span style={{
                        fontSize: "0.65rem", color: "rgba(232,245,238,0.22)", fontFamily: "var(--font-mono)",
                        padding: "2px 8px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6,
                      }}>
                        {m.kickoff ? fmtDate(m.kickoff) : "TBD"}
                      </span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.team2}</span>
                    {total > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: "rgba(232,245,238,0.25)" }}>
                        {total}/{players.length} đã đoán
                      </span>
                    )}
                  </div>

                  {total > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", height: 3, borderRadius: 99, overflow: "hidden", gap: 1, marginBottom: 5 }}>
                        {(["team1", "draw", "team2"] as Pick[]).map((p) => {
                          const pct = (counts[p] / players.length) * 100;
                          return pct > 0 ? (
                            <div key={p} style={{
                              width: `${pct}%`, background: PICK_COLORS[p],
                              opacity: hasScore ? (p === m.result ? 1 : 0.3) : 0.6,
                              borderRadius: 99,
                            }} />
                          ) : null;
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 14 }}>
                        {(["team1", "draw", "team2"] as Pick[]).map((p) => (
                          counts[p] > 0 && (
                            <span key={p} style={{
                              fontSize: "0.62rem", fontFamily: "var(--font-mono)",
                              color: hasScore
                                ? (p === m.result ? PICK_COLORS[p] : "rgba(232,245,238,0.2)")
                                : PICK_COLORS[p],
                            }}>
                              {pickLabel(m, p)} · {counts[p]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {players.map((pl) => {
                      const pick = picks.get(pl.id);
                      if (!pick) return null;
                      const correct = hasScore && pick === m.result;
                      const wrong   = hasScore && pick !== m.result;
                      const isMe    = pl.id === myId;
                      return (
                        <span key={pl.id} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 9px", borderRadius: 99, fontSize: "0.72rem",
                          fontWeight: isMe ? 700 : 500,
                          background: correct ? PICK_BG.team1 : wrong ? "rgba(255,77,106,0.05)" : PICK_BG[pick],
                          border: `1px solid ${correct ? "rgba(0,232,122,0.25)" : wrong ? "rgba(255,77,106,0.15)" : "rgba(255,255,255,0.06)"}`,
                          color: correct ? "#6fffb4" : wrong ? "#ff9dac" : isMe ? "#E8F5EE" : "rgba(232,245,238,0.45)",
                          textDecoration: wrong ? "line-through" : "none",
                        }}>
                          {isMe && "★ "}{pl.name.split(" ").pop()}: {pickLabel(m, pick)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
