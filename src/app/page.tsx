import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { computeLeaderboard } from "@/lib/scoring";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

function fmtMoney(k: number) {
  if (k === 0) return "0";
  return (k > 0 ? "+" : "") + k.toLocaleString("vi-VN") + "k";
}

export default async function HomePage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const [rows, settings] = await Promise.all([computeLeaderboard(), getSettings()]);
  const groupPenalty = settings.group_penalty ?? 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Page title */}
      <div className="anim-up" style={{ paddingTop: 8 }}>
        <p className="label" style={{ marginBottom: 6 }}>World Cup 2026 · Internal Pool</p>
        <h1 className="font-display" style={{
          fontSize: "clamp(3rem,8vw,5rem)", lineHeight: 0.9,
          letterSpacing: "0.04em", color: "#E8F5EE",
        }}>
          BẢNG <span className="text-green-grad">XẾP HẠNG</span>
        </h1>
      </div>

      {/* Champion banner */}
      {settings.champion && (
        <div className="glass glass-gold anim-up d1" style={{ padding: "20px 28px", display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: "2.8rem" }}>🏆</span>
          <div>
            <p className="label" style={{ color: "#FFB800", marginBottom: 4 }}>Nhà vô địch</p>
            <p className="font-display text-gold-grad" style={{ fontSize: "2rem", letterSpacing: "0.06em" }}>
              {settings.champion}
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="anim-up d2">
        {/* Header */}
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
          const isMe   = r.player.id === player.id;
          const rankColors = ["#FFB800", "rgba(180,180,200,0.85)", "#CD7C2E"];
          const topColor   = i < 3 ? rankColors[i] : "rgba(232,245,238,0.18)";
          const acc = r.played > 0 ? Math.round((r.correct / r.played) * 100) : 0;
          const balanceColor = r.balance > 0 ? "#00E87A" : r.balance < 0 ? "#FF4D6A" : "rgba(232,245,238,0.3)";

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
              {/* Rank */}
              <div className="font-display" style={{
                fontSize: i < 3 ? "2rem" : "1.3rem",
                lineHeight: 1, color: topColor, letterSpacing: "0.02em",
              }}>
                {i === 0 ? "①" : i === 1 ? "②" : i === 2 ? "③" : r.rank}
              </div>

              {/* Player */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: i === 0
                    ? "linear-gradient(135deg,#FFB800,#FF8C00)"
                    : i === 1 ? "linear-gradient(135deg,#94a3b8,#475569)"
                    : i === 2 ? "linear-gradient(135deg,#CD7C2E,#7c4a1e)"
                    : "linear-gradient(135deg,#00E87A22,#007A4022)",
                  border: `1.5px solid ${i < 3 ? "transparent" : "rgba(0,232,122,0.12)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700,
                  color: i < 3 ? "#fff" : "#00E87A",
                  boxShadow: i === 0 ? "0 4px 20px rgba(255,184,0,0.3)" : "none",
                }}>
                  {r.player.name[0]}
                </div>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontWeight: 700, fontSize: "0.95rem",
                      color: isMe ? "#00E87A" : "#E8F5EE",
                    }}>{r.player.name}</span>
                    {isMe && (
                      <span style={{
                        fontSize: "0.6rem", fontFamily: "var(--font-mono)",
                        background: "rgba(0,232,122,0.12)",
                        border: "1px solid rgba(0,232,122,0.25)",
                        color: "#00E87A", padding: "1px 6px", borderRadius: 99,
                      }}>bạn</span>
                    )}
                  </div>
                  {/* Accuracy bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <div style={{ width: 48, height: 2, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${acc}%`, borderRadius: 99, background: i < 3 ? rankColors[i] : "#00E87A55", transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: "rgba(232,245,238,0.25)" }}>
                      {r.correct}/{r.played}
                    </span>
                  </div>
                </div>
              </div>

              {/* Correct count */}
              <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "rgba(232,245,238,0.28)" }}>
                {r.correct}
              </div>

              {/* Champion bonus */}
              <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: r.championBonus > 0 ? "#FFB800" : "rgba(232,245,238,0.15)" }}>
                {r.championBonus > 0 ? "+100k" : "—"}
              </div>

              {/* Balance */}
              <div className="font-display" style={{
                textAlign: "right",
                fontSize: i < 3 ? "2rem" : "1.6rem",
                lineHeight: 1, letterSpacing: "0.02em",
                color: i < 3 ? (r.balance >= 0 ? rankColors[i] : "#FF4D6A") : balanceColor,
                filter: i === 0 ? "drop-shadow(0 0 8px rgba(255,184,0,0.35))" : "none",
              }}>
                {fmtMoney(r.balance)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend / luật */}
      <div className="glass anim-up d3" style={{ padding: "16px 20px" }}>
        <p className="label" style={{ marginBottom: 10 }}>Luật tính tiền</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            ["Vòng bảng sai", `-${groupPenalty}k`, "#FF4D6A"],
            ["1/32 sai", "-10k", "#FF4D6A"],
            ["1/16 sai", "-20k", "#FF4D6A"],
            ["Tứ kết sai", "-30k", "#FF4D6A"],
            ["Bán kết sai", "-40k", "#FF4D6A"],
            ["Chung kết sai", "-50k", "#FF4D6A"],
            ["Vô địch đúng", "+100k", "#FFB800"],
          ].map(([label, val, color]) => (
            <div key={label} style={{
              display: "flex", alignItems: "baseline", gap: 5,
              padding: "4px 12px", borderRadius: 99,
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontSize: "0.65rem", color: "rgba(232,245,238,0.28)", fontFamily: "var(--font-barlow)" }}>{label}</span>
              <span className="font-display" style={{ fontSize: "0.95rem", color, lineHeight: 1 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
