import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pulled from the Gameday logo, converted to OKLCH-tuned hex
        ink: "#17171a",        // logo black, warmed
        chalk: "#f4f3f1",      // card-stock off-white (never pure white)
        gameday: "#ee3d44",    // logo red — the ONE action color
        "gameday-deep": "#c92d34",
        silver: "#c9cbce",     // logo silver banner
        steel: "#6f7175",      // muted text
        felt: "#e7e5e2",       // table rules / dividers
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
