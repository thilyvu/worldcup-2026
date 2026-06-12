import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"], 
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        ui:      ["var(--font-barlow)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
