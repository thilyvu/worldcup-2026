"use client";

import { useState } from "react";

function fmtMoney(k: number) {
  if (k === 0) return "0";
  return (k > 0 ? "+" : "") + k.toLocaleString("vi-VN") + "k";
}

const RANK_COLORS = ["#FFB800", "rgba(180,180,200,0.85)", "#CD7C2E"];

type Player = { id: string; name: string; is_admin: boolean };

export type OverviewRow = {
  player: Player;
  balance: number;
  correct: number;
  played: number;
  penalty: number;
  championBonus: number;
  rank: number;
};

export type RoundStatRow = {
  player: Player;
  correct: number;
  played: number;
  penalty: number;
  balance: number;
};

export type RoundTabData = {
  round: string;
  label: string;
  stats: RoundStatRow[];
};

type Props = {
  rows: OverviewRow[];
  roundStats: RoundTabData[];
  myId: string;
};

function PlayerAvatar({ name, rank }: { name: string; rank: number }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: rank === 0
        ? "linear-gradient(135deg,#FFB800,#FF8C00)"
        : rank === 1 ? "linear-gradient(135deg,#94a3b8,#475569)"
        : rank === 2 ? "linear-gradient(135deg,#CD7C2E,#7c4a1e)"
        : "linear-gradient(135deg,#00E87A22,#007A4022)",
      border: `1.5px solid ${rank < 3 ? "transparent" : "rgba(0,232,122,0.12)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700,
      color: rank < 3 ? "#fff" : "#00E87A",
      boxShadow: rank === 0 ? "0 4px 16px rgba(255,184,0,0.28)" : "none",
    }}>
      {name[0]}
    </div>
  );
}

function RankBadge({ index }: { index: number }) {
  const color = index < 3 ? RANK_COLORS[index] : "rgba(232,245,238,0.18)";
  return (
    <div className="font-display" style={{
      fontSize: index < 3 ? "1.9rem" : "1.2rem",
      lineHeight: 1, color, letterSpacing: "0.02em",
    }}>
      {index === 0 ? "①" : index === 1 ? "②" : index === 2 ? "③" : index + 1}
    </div>
  );
}

export function LeaderboardTabs({ rows, roundStats, myId }: Props) {
  const [active, setActive] = useState<string>("overview");

  const tabs = [
    { key: "overview", label: "Tổng quan" },
    ...roundStats.map((r) => ({ key: r.round, label: r.label })),
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto",
        paddingBottom: 12, marginBottom: 4,
        scrollbarWidth: "none",
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              style={{
                flexShrink: 0,
                padding: "5px 14px",
                borderRadius: 99,
                border: isActive
                  ? "1px solid rgba(0,232,122,0.45)"
                  : "1px solid rgba(255,255,255,0.07)",
                background: isActive ? "rgba(0,232,122,0.09)" : "transparent",
                color: isActive ? "#00E87A" : "rgba(232,245,238,0.38)",
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview ── */}
      {active === "overview" && (
        <div>
          <div style={{
            display: "grid", gridTemplateColumns: "52px 1fr 64px 80px 90px",
            padding: "8px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {["#", "Người chơi", "Đúng", "Vô địch", "Số dư"].map((h, i) => (
              <span key={h} className="label" style={{ textAlign: i > 1 ? "right" : "left" }}>{h}</span>
            ))}
          </div>

          {rows.map((r, i) => {
            const isMe = r.player.id === myId;
            const topColor = i < 3 ? RANK_COLORS[i] : "rgba(232,245,238,0.18)";
            const acc = r.played > 0 ? Math.round((r.correct / r.played) * 100) : 0;
            const balColor = r.balance > 0 ? "#00E87A" : r.balance < 0 ? "#FF4D6A" : "rgba(232,245,238,0.3)";

            return (
              <div
                key={r.player.id}
                className="anim-up"
                style={{
                  animationDelay: `${0.04 * i + 0.1}s`,
                  display: "grid",
                  gridTemplateColumns: "52px 1fr 64px 80px 90px",
                  alignItems: "center",
                  padding: "13px 20px",
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  background: isMe ? "rgba(0,232,122,0.04)" : "transparent",
                  borderLeft: isMe ? "3px solid rgba(0,232,122,0.5)" : "3px solid transparent",
                }}
              >
                <div className="font-display" style={{
                  fontSize: i < 3 ? "2rem" : "1.3rem",
                  lineHeight: 1, color: topColor, letterSpacing: "0.02em",
                }}>
                  {i === 0 ? "①" : i === 1 ? "②" : i === 2 ? "③" : r.rank}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <PlayerAvatar name={r.player.name} rank={i} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: isMe ? "#00E87A" : "#E8F5EE" }}>
                        {r.player.name}
                      </span>
                      {isMe && (
                        <span style={{
                          fontSize: "0.6rem", fontFamily: "var(--font-mono)",
                          background: "rgba(0,232,122,0.12)",
                          border: "1px solid rgba(0,232,122,0.25)",
                          color: "#00E87A", padding: "1px 6px", borderRadius: 99,
                        }}>bạn</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{ width: 48, height: 2, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${acc}%`, borderRadius: 99, background: i < 3 ? RANK_COLORS[i] : "#00E87A55", transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: "rgba(232,245,238,0.25)" }}>
                        {r.correct}/{r.played}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "rgba(232,245,238,0.28)" }}>
                  {r.correct}
                </div>

                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: r.championBonus > 0 ? "#FFB800" : "rgba(232,245,238,0.15)" }}>
                  {r.championBonus > 0 ? "+100k" : "—"}
                </div>

                <div className="font-display" style={{
                  textAlign: "right",
                  fontSize: i < 3 ? "2rem" : "1.6rem",
                  lineHeight: 1, letterSpacing: "0.02em",
                  color: i < 3 ? (r.balance >= 0 ? RANK_COLORS[i] : "#FF4D6A") : balColor,
                  filter: i === 0 ? "drop-shadow(0 0 8px rgba(255,184,0,0.35))" : "none",
                }}>
                  {fmtMoney(r.balance)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Round tabs ── */}
      {roundStats.map((rd) => {
        if (active !== rd.round) return null;
        return (
          <div key={rd.round}>
            <div style={{
              display: "grid", gridTemplateColumns: "48px 1fr 84px 90px",
              padding: "8px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {["#", "Người chơi", "Đúng/Đấu", "Vòng này"].map((h, i) => (
                <span key={h} className="label" style={{ textAlign: i > 1 ? "right" : "left" }}>{h}</span>
              ))}
            </div>

            {rd.stats.map((s, i) => {
              const isMe = s.player.id === myId;
              const balColor = s.balance > 0 ? "#00E87A" : s.balance < 0 ? "#FF4D6A" : "rgba(232,245,238,0.3)";

              return (
                <div
                  key={s.player.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 84px 90px",
                    alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: i < rd.stats.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    background: isMe ? "rgba(0,232,122,0.04)" : "transparent",
                    borderLeft: isMe ? "3px solid rgba(0,232,122,0.5)" : "3px solid transparent",
                  }}
                >
                  <RankBadge index={i} />

                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <PlayerAvatar name={s.player.name} rank={i} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: isMe ? "#00E87A" : "#E8F5EE" }}>
                        {s.player.name}
                      </span>
                      {isMe && (
                        <span style={{
                          fontSize: "0.6rem", fontFamily: "var(--font-mono)",
                          background: "rgba(0,232,122,0.12)",
                          border: "1px solid rgba(0,232,122,0.25)",
                          color: "#00E87A", padding: "1px 6px", borderRadius: 99,
                        }}>bạn</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "rgba(232,245,238,0.38)" }}>
                    {s.correct}/{s.played}
                  </div>

                  <div className="font-display" style={{
                    textAlign: "right",
                    fontSize: i < 3 ? "1.8rem" : "1.45rem",
                    lineHeight: 1, letterSpacing: "0.02em",
                    color: i < 3 ? (s.balance >= 0 ? RANK_COLORS[i] : "#FF4D6A") : balColor,
                    filter: i === 0 ? "drop-shadow(0 0 8px rgba(255,184,0,0.28))" : "none",
                  }}>
                    {fmtMoney(s.balance)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
