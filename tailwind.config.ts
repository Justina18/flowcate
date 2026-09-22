import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          faint: "var(--ink-faint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(24,24,27,0.04), 0 12px 24px -8px rgba(24,24,27,0.08)",
        panel: "0 4px 8px rgba(24,24,27,0.04), 0 16px 32px -12px rgba(24,24,27,0.12)",
      },
      keyframes: {
        "panel-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "card-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "panel-in": "panel-in 0.15s ease-out",
        "card-in": "card-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
