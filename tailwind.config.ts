import type { Config } from "tailwindcss";

/**
 * Theme: light gray ground, navy blue brand, white cards with drop shadows.
 *
 * `navy` is the single brand scale; `chassis` (the header bar) and `accent`
 * are aliases into it so components can speak in roles.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f2f5f9",
          100: "#e3eaf3",
          200: "#c3d2e4",
          300: "#96b0cd",
          400: "#5f83ab",
          500: "#39618d",
          600: "#274b74",
          700: "#1e3a5c",
          800: "#172d48",
          900: "#102036",
        },
        chassis: "#102036", // header/footer bar — navy-900
        accent: {
          DEFAULT: "#c3d2e4", // navy-200: hover fills, highlights
          dark: "#274b74", // navy-600: headings, links
        },
      },
      boxShadow: {
        // The standard card shadow: soft, slightly navy-tinted drop.
        card: "0 1px 3px rgba(16, 32, 54, 0.10), 0 4px 14px rgba(16, 32, 54, 0.08)",
      },
      fontFamily: {
        display: ['"Courier New"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
