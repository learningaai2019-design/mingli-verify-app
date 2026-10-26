import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { 0: "#fff8f0", 1: "#fff3e6", 2: "#ffe8d2" },
        tx: { 0: "#3a2a1a", 1: "#4a3728", 2: "#7a634f", 3: "#9a8470" },
        ac: { DEFAULT: "#b87333", dim: "#d4924a" },
      },
      fontFamily: {
        sans: ["var(--font)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", pill: "999px",
      },
    },
  },
  plugins: [],
};
export default config;
