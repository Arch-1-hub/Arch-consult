import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0C0E", // primary near-black background
          soft: "#1C1D20", // elevated dark surface
          line: "#2A2B2E", // hairline rules on dark
        },
        paper: {
          DEFAULT: "#F7F6F2", // warm off-white surface
          white: "#FAFAF9", // white text on dark / pure surfaces
          line: "#E4E1D8", // hairline rules on light
        },
        gold: {
          DEFAULT: "#B8934A", // primary accent
          light: "#E4C989", // hover / highlight
          dim: "#8C6F3B", // pressed / subdued
        },
        ash: {
          DEFAULT: "#8A8B8F", // muted body text on dark
          light: "#6B6B63", // muted body text on paper
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-plex)", "Helvetica", "Arial", "sans-serif"],
      },
      maxWidth: {
        content: "1240px",
      },
      letterSpacing: {
        wide2: "0.14em",
      },
      transitionTimingFunction: {
        arch: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
