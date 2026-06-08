"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionPlayer } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

const links = [
  { href: "/",         label: "XẾP HẠNG",  icon: "⚡" },
  { href: "/predict",  label: "DỰ ĐOÁN",   icon: "🎯" },
  { href: "/matches",  label: "TRẬN ĐẤU",  icon: "📋" },
  { href: "/groups",   label: "BẢNG ĐẤU",  icon: "📊" },
  { href: "/champion", label: "VÔ ĐỊCH",   icon: "🏆" },
];

export function Nav({ player }: { player: SessionPlayer }) {
  const path = usePathname();
  return (
    <header className="site-nav">
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", padding: "0 1rem", height: 52 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 20, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #00E87A 0%, #007A40 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, boxShadow: "0 2px 16px rgba(0,232,122,0.35)",
          }}>⚽</div>
          <span style={{
            fontFamily: "var(--font-bebas)", fontSize: "1.25rem",
            letterSpacing: "0.05em", color: "#E8F5EE", lineHeight: 1,
          }}>
            WC<span style={{ color: "#00E87A" }}>26</span>
          </span>
        </Link>

        {/* Links */}
        <nav style={{ display: "flex", flex: 1, gap: 2, overflowX: "auto" }}>
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 11px", borderRadius: 8, textDecoration: "none",
                transition: "all 0.15s", whiteSpace: "nowrap",
                fontFamily: "var(--font-barlow)", fontWeight: 700,
                fontSize: "0.72rem", letterSpacing: "0.06em",
                background: active ? "rgba(0,232,122,0.1)" : "transparent",
                color: active ? "#00E87A" : "rgba(232,245,238,0.35)",
                borderBottom: active ? "2px solid #00E87A" : "2px solid transparent",
              }}>
                <span style={{ fontSize: "0.8rem" }}>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
          {player.is_admin && (
            <Link href="/admin" style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 11px", borderRadius: 8, textDecoration: "none",
              transition: "all 0.15s", whiteSpace: "nowrap",
              fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.06em",
              background: path.startsWith("/admin") ? "rgba(255,184,0,0.1)" : "transparent",
              color: path.startsWith("/admin") ? "#FFB800" : "rgba(255,184,0,0.4)",
              borderBottom: path.startsWith("/admin") ? "2px solid #FFB800" : "2px solid transparent",
            }}>
              <span>⚙️</span>
              <span className="hidden sm:inline">ADMIN</span>
            </Link>
          )}
        </nav>

        {/* Player chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 10px 4px 4px",
            borderRadius: 99,
            background: "rgba(0,232,122,0.06)",
            border: "1px solid rgba(0,232,122,0.15)",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "linear-gradient(135deg,#00E87A,#007A40)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#001a0d",
            }}>{player.name[0]}</div>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#E8F5EE", fontFamily: "var(--font-barlow)" }}>
              {player.name.split(" ")[0]}
            </span>
          </div>
          <form action={logoutAction}>
            <button style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.85rem", color: "rgba(232,245,238,0.25)", padding: 4,
              transition: "color 0.15s",
            }} title="Đăng xuất">↩</button>
          </form>
        </div>
      </div>
    </header>
  );
}
