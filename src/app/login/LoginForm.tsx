"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions";

export function LoginForm({ players }: { players: string[] }) {
  const [state, action, pending] = useActionState(loginAction, null as { error?: string } | null);
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <p className="label" style={{ marginBottom: 8 }}>Tên của bạn</p>
        <select name="name" required defaultValue="" className="input">
          <option value="" disabled>— Chọn tên —</option>
          {players.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <p className="label" style={{ marginBottom: 8 }}>PIN</p>
        <input
          name="pin" type="password" inputMode="numeric"
          autoComplete="current-password" placeholder="••••"
          minLength={4} required className="input"
          style={{ letterSpacing: "0.3em", fontSize: "1.2rem" }}
        />
      </div>
      {state?.error && (
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: "rgba(255,77,106,0.07)", border: "1px solid rgba(255,77,106,0.2)",
          color: "#ff9dac", fontSize: "0.88rem", fontWeight: 600,
        }}>
          {state.error}
        </div>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{
        width: "100%", padding: "14px 0", letterSpacing: "0.12em",
        fontFamily: "var(--font-bebas)", fontSize: "1.3rem",
      }}>
        {pending ? "ĐANG VÀO..." : "VÀO SÂN →"}
      </button>
    </form>
  );
}
