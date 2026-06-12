"use client";

import { useState, useTransition } from "react";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleSync() {
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (!res.ok) {
          setMsg(`Lỗi: ${data.error}`);
          return;
        }
        setMsg(
          data.updated > 0
            ? `✓ Đã sync ${data.updated} trận`
            : "Không có trận mới nào đã xong"
        );
      } catch (e) {
        setMsg(`Lỗi: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={handleSync}
        disabled={isPending}
        style={{
          padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(0,232,122,0.3)",
          background: isPending ? "rgba(0,232,122,0.03)" : "rgba(0,232,122,0.07)",
          color: isPending ? "rgba(0,232,122,0.4)" : "#00E87A",
          fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.9rem",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? "Đang sync..." : "⟳ Sync kết quả"}
      </button>
      {msg && (
        <span style={{
          fontSize: "0.72rem", fontFamily: "var(--font-mono)",
          color: msg.startsWith("✓") ? "#00E87A" : "#FF4D6A",
        }}>
          {msg}
        </span>
      )}
    </div>
  );
}
