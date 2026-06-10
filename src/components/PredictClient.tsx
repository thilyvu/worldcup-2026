"use client";

import { useState } from "react";
import { ROUND_LABEL, ROUND_ORDER, isLocked, pickLabel, type Match, type Pick } from "@/lib/types";
import { savePredictionAction } from "@/lib/actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function PickBtn({ match, pick, current, locked }: {
  match: Match; pick: Pick; current: Pick | undefined; locked: boolean;
}) {
  const label = pickLabel(match, pick);
  const isActive  = current === pick;
  const isCorrect = match.status === "finished" && pick === match.result;
  const isWrong   = match.status === "finished" && current === pick && match.result !== pick;
  const cls = isCorrect ? "pick-btn correct" : isWrong ? "pick-btn wrong" : isActive ? "pick-btn active" : "pick-btn";
  return (
    <form action={savePredictionAction}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="pick" value={pick} />
      <button className={cls} disabled={locked} title={label}>
        {isCorrect && <span style={{ marginRight: 3 }}>✓</span>}{label}
      </button>
    </form>
  );
}

function StatChip({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 7,
      padding: "6px 14px", borderRadius: 99,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <span className="label">{label}</span>
      <span className="font-display" style={{ fontSize: "1.2rem", lineHeight: 1, color }}>{val}</span>
    </div>
  );
}

export function PredictClient({
  allMatches,
  predEntries,
}: {
  allMatches: Match[];
  predEntries: [string, Pick][];
}) {
  const [round, setRound] = useState<typeof ROUND_ORDER[number]>("group");
  const predMap = new Map(predEntries);

  const matches = allMatches.filter(m => m.round === round);
  const predicted = matches.filter(m => predMap.has(m.id)).length;
  const finished  = matches.filter(m => m.status === "finished").length;
  const correct   = matches.filter(m => m.status === "finished" && predMap.get(m.id) === m.result).length;

  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    const k = m.group_name ?? "—";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="anim-up">
        <p className="label" style={{ marginBottom: 6 }}>Dự đoán kết quả</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.2rem,6vw,3.8rem)", lineHeight: 0.9, letterSpacing: "0.04em" }}>
            <span className="text-green-grad">{ROUND_LABEL[round].toUpperCase()}</span>
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatChip label="ĐÃ ĐOÁN" val={`${predicted}/${matches.length}`} color="#00E87A" />
            {finished > 0 && <StatChip label="ĐÚNG" val={`${correct}/${finished}`} color="#FFB800" />}
          </div>
        </div>
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

      {/* Match groups */}
      {[...groups.entries()].map(([group, gMatches]) => (
        <div key={group}>
          {round === "group" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div className="g-badge">{group}</div>
              <span className="label">Bảng {group}</span>
            </div>
          )}
          <div className="glass" style={{ padding: 0 }}>
            {gMatches.map((m, mi) => {
              const locked  = isLocked(m);
              const current = predMap.get(m.id);
              const hasScore = m.status === "finished" && m.score1 != null;
              const upcoming = !locked && m.status !== "finished";
              return (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 18px",
                  borderBottom: mi < gMatches.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.team1}</span>
                      {hasScore ? (
                        <span className="score-badge">{m.score1} – {m.score2}</span>
                      ) : (
                        <span style={{
                          fontSize: "0.65rem", fontFamily: "var(--font-mono)",
                          color: "rgba(232,245,238,0.2)", padding: "2px 8px",
                          border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6,
                        }}>VS</span>
                      )}
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.team2}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      {m.kickoff && (
                        <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "rgba(232,245,238,0.22)" }}>
                          {fmtDate(m.kickoff)}
                        </span>
                      )}
                      {locked && !hasScore && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: "#FFB800" }}>
                          <span className="live-dot" />LIVE
                        </span>
                      )}
                      {upcoming && !current && (
                        <span style={{ fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: "rgba(255,184,0,0.6)" }}>
                          ⚠ chưa đoán
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <PickBtn match={m} pick="team1" current={current} locked={locked} />
                    {m.round === "group" && <PickBtn match={m} pick="draw" current={current} locked={locked} />}
                    <PickBtn match={m} pick="team2" current={current} locked={locked} />
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
