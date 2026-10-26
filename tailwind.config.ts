import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { 0: "#020810", 1: "#0a1020", 2: "#141e30" },
        tx: { 0: "#e8eef6", 1: "#dce4f0", 2: "#9db0d0", 3: "#6a7a96" },
        ac: { DEFAULT: "#d4a843", dim: "#e8c060" },
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
