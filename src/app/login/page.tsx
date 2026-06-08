import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getPlayers } from "@/lib/queries";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getCurrentPlayer()) redirect("/");
  const players = await getPlayers();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", position: "relative",
    }}>
      {/* Extra glow for login */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,232,122,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div className="anim-up" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 80, height: 80, borderRadius: 22,
            background: "linear-gradient(135deg,#00E87A 0%,#007A40 100%)",
            fontSize: 40, marginBottom: 20,
            boxShadow: "0 8px 48px rgba(0,232,122,0.3)",
          }}>⚽</div>
          <h1 className="font-display" style={{
            fontSize: "clamp(3rem,10vw,4.5rem)", lineHeight: 0.88,
            letterSpacing: "0.04em", display: "block",
          }}>
            <span style={{ color: "#E8F5EE" }}>WORLD </span>
            <span className="text-green-grad">CUP</span>
            <br />
            <span style={{ color: "#E8F5EE" }}>20</span>
            <span className="text-green-grad">26</span>
          </h1>
          <p className="label" style={{ marginTop: 12 }}>Giải dự đoán nội bộ</p>
        </div>

        {/* Glass form card */}
        <div className="glass anim-up d1" style={{ padding: "32px 28px" }}>
          <LoginForm players={players.map((p) => p.name)} />
        </div>

        <p className="anim-up d2" style={{
          marginTop: 18, textAlign: "center",
          fontSize: "0.72rem", fontFamily: "var(--font-mono)",
          color: "rgba(232,245,238,0.2)", lineHeight: 1.7,
        }}>
          Lần đầu: chọn tên và tự đặt PIN ≥ 4 ký tự.<br />
          PIN sẽ dùng cho các lần đăng nhập sau.
        </p>
      </div>
    </div>
  );
}
