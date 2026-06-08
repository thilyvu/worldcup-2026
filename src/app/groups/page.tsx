import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getMatches } from "@/lib/queries";
import { computeGroupStandings } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const matches = await getMatches("group");
  const standings = computeGroupStandings(matches);
  const groups = [...standings.keys()];
  const finished = matches.filter(m => m.status === "finished").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="anim-up">
        <p className="label" style={{ marginBottom: 6 }}>Group Stage · {finished}/{matches.length} trận</p>
        <h1 className="font-display" style={{ fontSize: "clamp(2.2rem,6vw,3.8rem)", lineHeight: 0.9, letterSpacing: "0.04em" }}>
          BẢNG <span className="text-green-grad">ĐẤU</span>
        </h1>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
        gap: 12,
      }}>
        {groups.map((g, gi) => {
          const rows = standings.get(g)!;
          return (
            <div key={g} className="glass anim-up" style={{ animationDelay: `${gi * 0.035}s` }}>
              {/* Group header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0,232,122,0.03)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(0,232,122,0.12)", border: "1px solid rgba(0,232,122,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-bebas)", fontSize: "1.1rem", color: "#00E87A",
                }}>{g}</div>
                <span style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.8rem", color: "rgba(232,245,238,0.5)" }}>
                  BẢNG {g}
                </span>
                {/* Qualification dots */}
                <div style={{ marginLeft: "auto", display: "flex", gap: 3, alignItems: "center" }}>
                  {rows.map((_, i) => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: i < 2 ? "#00E87A" : "rgba(255,255,255,0.1)",
                      boxShadow: i < 2 ? "0 0 6px rgba(0,232,122,0.5)" : "none",
                    }} />
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ padding: "6px 0" }}>
                {/* Thead */}
                <div style={{
                  display: "grid", gridTemplateColumns: "26px 1fr 22px 22px 22px 22px 30px",
                  padding: "4px 16px 6px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {["","Đội","Pl","W","D","L","Pts"].map((h, hi) => (
                    <span key={hi} className="label" style={{ textAlign: hi > 1 ? "center" : "left", fontSize: "0.55rem" }}>{h}</span>
                  ))}
                </div>

                {rows.map((r, i) => {
                  const q = i < 2;
                  return (
                    <div key={r.team} style={{
                      display: "grid", gridTemplateColumns: "26px 1fr 22px 22px 22px 22px 30px",
                      padding: "8px 16px", alignItems: "center",
                      borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      background: q ? "rgba(0,232,122,0.025)" : "transparent",
                      borderLeft: q ? "2px solid rgba(0,232,122,0.3)" : "2px solid transparent",
                    }}>
                      <span style={{
                        fontSize: "0.65rem", fontFamily: "var(--font-mono)", fontWeight: 700,
                        color: q ? "#00E87A" : "rgba(232,245,238,0.2)",
                      }}>{i + 1}</span>
                      <span style={{
                        fontSize: "0.82rem", fontWeight: q ? 700 : 500,
                        color: q ? "#E8F5EE" : "rgba(232,245,238,0.45)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{r.team}</span>
                      {[r.pl, r.w, r.d, r.l].map((v, vi) => (
                        <span key={vi} style={{
                          textAlign: "center", fontSize: "0.78rem",
                          fontFamily: "var(--font-mono)", color: "rgba(232,245,238,0.3)",
                        }}>{v}</span>
                      ))}
                      <span className="font-display" style={{
                        textAlign: "center", fontSize: "1.1rem", lineHeight: 1,
                        color: q ? "#00E87A" : "rgba(232,245,238,0.35)",
                      }}>{r.pts}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
