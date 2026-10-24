import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // "Seed sack" palette — kraft paper, sack-print brown ink, field green,
      // wheat ochre and a red inspection stamp. Scale names are kept from
      // v2.0 so every page picks the palette up.
      colors: {
        // Unbleached label paper; pure #fff reads as a hole in the kraft.
        white: "#FAF4E6",
        paper: {
          DEFAULT: "#EFE4CC",
          alt:     "#E2D2B0",
          white:   "#FAF4E6",
        },
        kraft: {
          DEFAULT: "#C9A877",
          dark:    "#A8865A",
        },
        // Ink — sack-print browns
        ink: {
          900: "#2A1F14",
          700: "#46382A",
          500: "#6B5A45",
          400: "#72634E", // ≥4.5:1 on paper: small labels must survive a projector
          300: "#8D7E67", // ≥3:1 on paper: decorative / large text only
          200: "#CDBB9C",
          100: "#DFD0B2",
        },
        // Primary — field green print
        leaf: {
          50:  "#EEF0E0",
          100: "#DDE3C4",
          200: "#BFCB96",
          300: "#9AAD67",
          400: "#789045",
          500: "#5C7633",
          600: "#4A6128",
          700: "#3B4E21",
          800: "#2E3D1A",
          900: "#1F2A12",
        },
        // Water / info
        aqua: {
          50:  "#EAF0EE",
          100: "#D2E0DC",
          400: "#5B8A8C",
          500: "#3D6B6E",
          600: "#2D5154",
        },
        // Wheat ochre — warning / seed
        amber: {
          50:  "#FAF0D9",
          100: "#F2DCA6",
          500: "#C38A1E",
          600: "#865D10", // ≥4.5:1 on paper for warning text
        },
        // Inspection stamp
        stamp: {
          500: "#B23A2A",
          600: "#932E21",
        },
      },
      fontFamily: {
        sans:    ["var(--font-onest)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-oswald)", "Impact", "sans-serif"],
        mono:    ["var(--font-ptmono)", "ui-monospace", "Menlo", "monospace"],
        stamp:   ["var(--font-dirt)", "var(--font-oswald)", "Impact", "sans-serif"],
        hand:    ["var(--font-caveat)", "cursive"],
      },
      letterSpacing: {
        tightx: "-0.02em",
        widex:  "0.14em",
      },
      // Hard, offset shadows — labels glued onto a sack, not floating glass
      boxShadow: {
        card:   "2px 3px 0 0 rgba(42,31,20,0.10)",
        "card-hover": "4px 6px 0 0 rgba(42,31,20,0.14)",
        soft:   "6px 8px 0 0 rgba(42,31,20,0.16)",
        ring:   "0 0 0 3px rgba(92,118,51,0.25)",
      },
      borderRadius: {
        "2xl":  "10px",
        "3xl":  "14px",
      },
      animation: {
        "fade-up":  "fadeUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "grow":     "grow 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "breath":   "breath 3s ease-in-out infinite",
        "shimmer":  "shimmer 2.4s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        grow: {
          "0%": { transform: "scaleY(0)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(1)", transformOrigin: "bottom" },
        },
        breath: {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
