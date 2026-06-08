import type { Metadata } from "next";
import { Bebas_Neue, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentPlayer } from "@/lib/auth";
import { Nav } from "@/components/Nav";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });
const barlow = Barlow_Condensed({ weight: ["400","500","600","700"], subsets: ["latin"], variable: "--font-barlow", display: "swap" });
const mono = JetBrains_Mono({ weight: ["400","500","700"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "WC2026 — Giải dự đoán",
  description: "Giải dự đoán World Cup 2026 nội bộ",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const player = await getCurrentPlayer();
  return (
    <html lang="vi" className={`${bebas.variable} ${barlow.variable} ${mono.variable}`}>
      <body>
        {/* Pitch SVG background — fixed, full screen, very subtle */}
        <div aria-hidden className="pitch-bg">
          <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Outer boundary */}
            <rect x="40" y="30" width="920" height="540" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2"/>
            {/* Halfway line */}
            <line x1="500" y1="30" x2="500" y2="570" stroke="currentColor" strokeWidth="1"/>
            {/* Center circle */}
            <circle cx="500" cy="300" r="90" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Center spot */}
            <circle cx="500" cy="300" r="4" fill="currentColor" opacity="0.6"/>
            {/* Left penalty area */}
            <rect x="40" y="185" width="130" height="230" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Right penalty area */}
            <rect x="830" y="185" width="130" height="230" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Left goal area */}
            <rect x="40" y="240" width="50" height="120" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Right goal area */}
            <rect x="910" y="240" width="50" height="120" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Left penalty arc */}
            <path d="M 170 255 A 80 80 0 0 1 170 345" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Right penalty arc */}
            <path d="M 830 255 A 80 80 0 0 0 830 345" fill="none" stroke="currentColor" strokeWidth="1"/>
            {/* Corner arcs */}
            <path d="M 40 50 A 16 16 0 0 1 56 30" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M 960 50 A 16 16 0 0 0 944 30" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M 40 550 A 16 16 0 0 0 56 570" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M 960 550 A 16 16 0 0 1 944 570" fill="none" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </div>

        {player && <Nav player={player} />}
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
