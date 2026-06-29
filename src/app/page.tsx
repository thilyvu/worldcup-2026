import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { computeLeaderboard, computePerRoundStats } from "@/lib/scoring";
import { getSettings } from "@/lib/queries";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const [rows, roundStats, settings] = await Promise.all([
    computeLeaderboard(),
    computePerRoundStats(),
    getSettings(),
  ]);
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

      {/* Leaderboard with tabs */}
      <div className="anim-up d2">
        <LeaderboardTabs
          rows={rows}
          roundStats={roundStats}
          myId={player.id}
        />
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
