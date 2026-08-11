import type { Config } from "tailwindcss";

/**
 * Palette follows the existing shankautorepair.com site: a dark chrome/steel
 * chassis with the light blue used for the active nav tab and the folded page
 * corner as the accent.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chassis: "#2b2523", // dark brown-black header bar
        steel: "#4a4a4a",
        accent: {
          DEFAULT: "#8ab6dd", // the light blue from the nav + page corner
          dark: "#5d93c2",
        },
      },
      fontFamily: {
        display: ['"Courier New"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
