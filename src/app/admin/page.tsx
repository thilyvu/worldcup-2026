import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getMatches, getSettings } from "@/lib/queries";
import { ROUND_LABEL, ROUND_ORDER } from "@/lib/types";
import { setResultAction, setTeamsAction, setChampionAction, setGroupPenaltyAction } from "@/lib/actions";
import { SyncButton } from "@/components/SyncButton";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ round?: string }> }) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");
  if (!player.is_admin) redirect("/");

  const { round: sel } = await searchParams;
  const round = ROUND_ORDER.includes(sel as never) ? sel as typeof ROUND_ORDER[number] : "group";

  const [matches, settings] = await Promise.all([getMatches(round), getSettings()]);
  const finished = matches.filter(m => m.status === "finished").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="anim-up">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <p className="label">Panel quản lý</p>
          <span style={{
            padding: "2px 10px", borderRadius: 99, fontSize: "0.6rem",
            fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.12em",
            background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.25)",
            color: "#FFB800",
          }}>ADMIN</span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.2rem,6vw,3.8rem)", lineHeight: 0.9, letterSpacing: "0.04em" }}>
          QUẢN LÝ <span className="text-gold-grad">KẾT QUẢ</span>
        </h1>
      </div>

      {/* Sync */}
      <div className="anim-up d1">
        <SyncButton />
      </div>

      {/* Settings row */}
      <div className="anim-up d2" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* Set champion */}
        <div className="glass glass-gold" style={{ padding: "20px 24px", flex: "1 1 260px" }}>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 12, color: "#FFB800" }}>🏆 Đặt nhà vô địch</p>
        <form action={setChampionAction} style={{ display: "flex", gap: 10 }}>
          <input
            name="champion" defaultValue={settings.champion ?? ""}
            placeholder="Tên đội vô địch" className="input"
            style={{ flex: 1, borderColor: "rgba(255,184,0,0.2)" }}
          />
          <button type="submit" style={{
            padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,184,0,0.3)",
            background: "rgba(255,184,0,0.07)", color: "#FFB800",
            fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.9rem",
            cursor: "pointer", flexShrink: 0,
          }}>Lưu</button>
        </form>
        </div>

        {/* Group penalty */}
        <div className="glass" style={{ padding: "20px 24px", flex: "1 1 200px" }}>
          <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 12, color: "#FF4D6A" }}>⚙ Phạt vòng bảng (k)</p>
          <form action={setGroupPenaltyAction} style={{ display: "flex", gap: 10 }}>
            <input
              name="group_penalty" type="number" min="0" step="1"
              defaultValue={settings.group_penalty ?? 5}
              className="input"
              style={{ width: 80, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem" }}
            />
            <button type="submit" style={{
              padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,77,106,0.3)",
              background: "rgba(255,77,106,0.07)", color: "#FF4D6A",
              fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.9rem",
              cursor: "pointer", flexShrink: 0,
            }}>Lưu</button>
          </form>
        </div>
      </div>

      {/* Round tabs */}
      <div className="anim-up d3" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ROUND_ORDER.map((r) => {
          const active = r === round;
          return (
            <a key={r} href={`/admin?round=${r}`} style={{
              padding: "7px 14px", borderRadius: 9, fontSize: "0.78rem",
              fontWeight: 700, textDecoration: "none", letterSpacing: "0.04em",
              transition: "all 0.15s", fontFamily: "var(--font-barlow)",
              background: active ? "rgba(255,184,0,0.1)" : "rgba(255,255,255,0.025)",
              color: active ? "#FFB800" : "rgba(232,245,238,0.7)",
              border: `1px solid ${active ? "rgba(255,184,0,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
              {ROUND_LABEL[r].toUpperCase()}
            </a>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg, #00E87A, #007A40)",
            width: matches.length > 0 ? `${(finished / matches.length) * 100}%` : "0%",
            transition: "width 0.5s ease",
          }} />
        </div>
        <span className="label">{finished}/{matches.length} đã xong</span>
      </div>

      {/* Match list */}
      <div className="glass anim-up d4" style={{ padding: 0 }}>
        {matches.map((m, i) => {
          const hasTBD = m.team1 === "TBD" || m.team2 === "TBD";
          return (
            <div key={m.id} style={{
              padding: "16px 20px",
              borderBottom: i < matches.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              borderLeft: m.status === "finished" ? "3px solid rgba(0,232,122,0.4)" : "3px solid transparent",
              background: m.status === "finished" ? "rgba(0,232,122,0.02)" : "transparent",
            }}>
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{m.team1}</span>
                {m.status === "finished" && m.score1 != null ? (
                  <span className="score-badge">{m.score1} – {m.score2}</span>
                ) : (
                  <span style={{ fontSize: "0.65rem", color: "rgba(232,245,238,0.22)", fontFamily: "var(--font-mono)" }}>vs</span>
                )}
                <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{m.team2}</span>
                {m.kickoff && (
                  <span className="label" style={{ marginLeft: "auto" }}>{fmtDate(m.kickoff)}</span>
                )}
                {m.status === "finished" && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 99, fontSize: "0.6rem",
                    fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em",
                    background: "rgba(0,232,122,0.1)", border: "1px solid rgba(0,232,122,0.22)",
                    color: "#00E87A",
                  }}>✓ XONG</span>
                )}
              </div>

              {/* Forms */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {hasTBD && (
                  <form action={setTeamsAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="hidden" name="matchId" value={m.id} />
                    <input name="team1" defaultValue={m.team1} placeholder="Đội 1" className="input" style={{ width: 120, fontSize: "0.85rem" }} />
                    <input name="team2" defaultValue={m.team2} placeholder="Đội 2" className="input" style={{ width: 120, fontSize: "0.85rem" }} />
                    <button type="submit" style={{
                      padding: "8px 14px", borderRadius: 9,
                      border: "1px solid rgba(77,158,255,0.3)", background: "rgba(77,158,255,0.07)",
                      color: "#4D9EFF", fontFamily: "var(--font-barlow)",
                      fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
                    }}>Cập nhật đội</button>
                  </form>
                )}

                <form action={setResultAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="hidden" name="matchId" value={m.id} />
                  <input
                    name="score1" type="number" min="0"
                    defaultValue={m.score1 ?? ""}
                    placeholder="0" className="input"
                    style={{ width: 60, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem" }}
                  />
                  <span style={{ color: "rgba(232,245,238,0.3)", fontWeight: 700 }}>–</span>
                  <input
                    name="score2" type="number" min="0"
                    defaultValue={m.score2 ?? ""}
                    placeholder="0" className="input"
                    style={{ width: 60, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem" }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "8px 16px" }}>
                    {m.status === "finished" ? "Sửa" : "Nhập kết quả"}
                  </button>
                  {m.status === "finished" && (
                    <button type="submit" name="score1" value="" style={{
                      padding: "8px 12px", borderRadius: 9,
                      border: "1px solid rgba(255,77,106,0.22)",
                      background: "transparent", color: "#FF4D6A",
                      fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                    }}>Xoá</button>
                  )}
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
