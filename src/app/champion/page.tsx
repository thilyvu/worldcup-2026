import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getChampionPicks, getChampionPickForPlayer, getPlayers, getSettings } from "@/lib/queries";
import { saveChampionAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const TEAMS = [
  "Algeria","Argentina","Australia","Austria","Belgium","Bosnia-Herzegovina",
  "Brazil","Canada","Cape Verde","Colombia","Croatia","Curacao","Czechia",
  "DR Congo","Ecuador","Egypt","England","France","Germany","Ghana",
  "Haiti","Iran","Iraq","Ivory Coast","Japan","Jordan","Mexico","Morocco",
  "Netherlands","New Zealand","Norway","Panama","Paraguay","Portugal",
  "Qatar","Saudi Arabia","Scotland","Senegal","South Africa","South Korea",
  "Spain","Sweden","Switzerland","Tunisia","Turkiye","Uruguay","USA","Uzbekistan",
];

export default async function ChampionPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const [settings, myPick, allPicks, players] = await Promise.all([
    getSettings(), getChampionPickForPlayer(player.id),
    getChampionPicks(), getPlayers(),
  ]);

  const locked = !!settings.champion_lock && new Date(settings.champion_lock).getTime() <= Date.now();
  const pickMap = new Map(allPicks.map((c) => [c.player_id, c.team]));
  const picked = allPicks.length;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "short", day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="anim-up">
        <p className="label" style={{ marginBottom: 6 }}>Lucky Round · 100 điểm</p>
        <h1 className="font-display" style={{ fontSize: "clamp(2.2rem,6vw,3.8rem)", lineHeight: 0.9, letterSpacing: "0.04em" }}>
          CHỌN NHÀ <span className="text-gold-grad">VÔ ĐỊCH</span>
        </h1>
        {settings.champion_lock && (
          <p className="label" style={{ marginTop: 8 }}>
            {locked ? "⛔ ĐÃ KHOÁ" : "⏳ KHOÁ LÚC"}{" "}
            {fmtDate(settings.champion_lock)}
          </p>
        )}
      </div>

      {/* Champion revealed */}
      {settings.champion && (
        <div className="glass glass-gold anim-up d1" style={{ padding: "24px 28px", display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: "3.5rem", filter: "drop-shadow(0 0 20px rgba(255,184,0,0.4))" }}>🏆</span>
          <div>
            <p className="label" style={{ color: "#FFB800", marginBottom: 6 }}>NHÀ VÔ ĐỊCH</p>
            <p className="font-display text-gold-grad" style={{ fontSize: "2.4rem", letterSpacing: "0.06em", lineHeight: 1 }}>
              {settings.champion}
            </p>
          </div>
        </div>
      )}

      {/* My pick */}
      <div className="anim-up d2">
        {!locked ? (
          <div className="glass" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.03em" }}>Lựa chọn của bạn</p>
              {myPick && (
                <span style={{
                  padding: "4px 14px", borderRadius: 99, fontSize: "0.82rem", fontWeight: 700,
                  background: "rgba(0,232,122,0.1)", border: "1px solid rgba(0,232,122,0.28)",
                  color: "#00E87A",
                }}>✓ {myPick}</span>
              )}
            </div>
            <form action={saveChampionAction} style={{ display: "flex", gap: 10 }}>
              <select name="team" defaultValue={myPick ?? ""} className="input" style={{ flex: 1 }}>
                <option value="" disabled>— Chọn đội —</option>
                {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Lưu</button>
            </form>
          </div>
        ) : (
          <div className="glass" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
            }}>🔒</div>
            <div>
              <p className="label" style={{ marginBottom: 4 }}>Đã khoá · Lựa chọn của bạn</p>
              <p style={{ fontWeight: 700, fontSize: "1.05rem", color: myPick ? "#E8F5EE" : "rgba(232,245,238,0.3)" }}>
                {myPick ?? "Chưa chọn"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Everyone's picks */}
      <div className="anim-up d3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p className="label">Lựa chọn của nhóm</p>
          <span className="label">{picked}/{players.length} đã chọn</span>
        </div>
        <div className="glass" style={{ padding: 0 }}>
          {players.map((p, i) => {
            const pick = pickMap.get(p.id);
            const won  = !!settings.champion && pick === settings.champion;
            const lost = locked && !!settings.champion && !!pick && pick !== settings.champion;
            const isMe = p.id === player.id;
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 20px",
                borderBottom: i < players.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: isMe ? "rgba(0,232,122,0.03)" : "transparent",
                borderLeft: isMe ? "3px solid rgba(0,232,122,0.4)" : "3px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: won
                      ? "linear-gradient(135deg,#FFB800,#FF8C00)"
                      : "linear-gradient(135deg,#00E87A22,#007A4022)",
                    border: `1.5px solid ${won ? "rgba(255,184,0,0.4)" : "rgba(0,232,122,0.12)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                    color: won ? "#fff" : "#00E87A",
                    boxShadow: won ? "0 0 16px rgba(255,184,0,0.3)" : "none",
                  }}>{p.name[0]}</div>
                  <span style={{ fontWeight: isMe ? 700 : 500, fontSize: "0.9rem" }}>{p.name}</span>
                </div>
                {pick ? (
                  <span style={{
                    padding: "4px 14px", borderRadius: 99, fontSize: "0.82rem", fontWeight: 700,
                    border: `1px solid ${won ? "rgba(255,184,0,0.35)" : lost ? "rgba(255,77,106,0.2)" : "rgba(255,255,255,0.07)"}`,
                    background: won ? "rgba(255,184,0,0.08)" : lost ? "rgba(255,77,106,0.05)" : "rgba(255,255,255,0.04)",
                    color: won ? "#FFB800" : lost ? "#ff9dac" : "rgba(232,245,238,0.5)",
                    textDecoration: lost ? "line-through" : "none",
                  }}>
                    {pick}{won && " 🏆"}
                  </span>
                ) : (
                  <span className="label">{locked ? "—" : "chưa chọn"}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
