import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#12171d",
        panel2: "#181e26",
        line: "#2a3544",
        ink: "#d7dee7",
        dim: "#8493a5",
        amber: "#e0b15a",
        mint: "#7dcea0",
        rose: "#e08b93",
        steel: "#8eb4d4",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        inset: "inset 0 0 0 1px rgba(42, 53, 68, 0.9)",
      },
    },
  },
  plugins: [],
};

export default config;
