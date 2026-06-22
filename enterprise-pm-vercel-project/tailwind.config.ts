import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0f172a",
        panel: "#111827",
        line: "#253044",
      },
      boxShadow: {
        glow: "0 18px 80px rgba(14, 165, 233, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
