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
      colors: {
        // Soft paper backgrounds
        paper: {
          DEFAULT: "#FAFBF7",
          alt:     "#F2F4EC",
          white:   "#FFFFFF",
        },
        // Ink — text palette
        ink: {
          900: "#0B1410",
          700: "#22302A",
          500: "#495A52",
          400: "#6C7A72",
          300: "#95A199",
          200: "#C9D0CA",
          100: "#E5E9E3",
        },
        // Primary — cultivated green (agri)
        leaf: {
          50:  "#F2F8F3",
          100: "#E1F0E4",
          200: "#C4E1CA",
          300: "#9BCBA4",
          400: "#6AAF78",
          500: "#3F9154",
          600: "#2B7440",
          700: "#225B33",
          800: "#1B4729",
          900: "#0F2E1A",
        },
        // Water / info accent
        aqua: {
          50:  "#EEF7FA",
          100: "#D8EDF2",
          400: "#3F9FB8",
          500: "#1E7F99",
          600: "#155E74",
        },
        // Earth — warning / seed
        amber: {
          50:  "#FDF6E4",
          100: "#FAE8B3",
          500: "#C88A1B",
          600: "#9F6B0F",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightx: "-0.02em",
        widex:  "0.14em",
      },
      boxShadow: {
        card:   "0 1px 0 0 rgba(34,48,42,0.04), 0 0 0 1px rgba(34,48,42,0.05)",
        "card-hover":
                "0 4px 20px -6px rgba(34,48,42,0.08), 0 0 0 1px rgba(43,116,64,0.15)",
        soft:   "0 20px 60px -30px rgba(15,46,26,0.15)",
        ring:   "0 0 0 3px rgba(63,145,84,0.18)",
      },
      borderRadius: {
        "2xl":  "18px",
        "3xl":  "24px",
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
