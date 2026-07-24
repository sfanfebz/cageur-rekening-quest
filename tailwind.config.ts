import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#eefbf9",
          100: "#d3f3ee",
          200: "#a6e6dc",
          300: "#72d2c5",
          400: "#3fb8ac",
          500: "#219a90",
          600: "#167c75",
          700: "#146360",
          800: "#144f4d",
          900: "#0f3a39",
        },
        navy: {
          50: "#eef2fb",
          100: "#d6e0f4",
          200: "#a9bce6",
          300: "#7a95d4",
          400: "#4f6fbc",
          500: "#33519f",
          600: "#243e80",
          700: "#1c3167",
          800: "#162650",
          900: "#0f1b38",
        },
        gold: {
          50: "#fffaeb",
          100: "#fef0c2",
          200: "#fde08a",
          300: "#fbcb4f",
          400: "#f7b626",
          500: "#e89b0c",
          600: "#c17908",
          700: "#98590b",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(33,154,144,0.45)" },
          "50%": { boxShadow: "0 0 0 10px rgba(33,154,144,0)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-28px)", opacity: "0" },
        },
        "coin-in": {
          "0%": { transform: "translateY(-12px) scale(0.6)", opacity: "0" },
          "60%": { transform: "translateY(2px) scale(1.05)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "timer-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "kang-bob": {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
        "badge-shine": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(6deg) scale(1.05)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.22s ease-out",
        shake: "shake 0.4s ease-in-out",
        "glow-pulse": "glow-pulse 1.1s ease-out",
        "float-up": "float-up 0.9s ease-out forwards",
        "coin-in": "coin-in 0.5s ease-out",
        "timer-pulse": "timer-pulse 1s ease-in-out infinite",
        "kang-bob": "kang-bob 1.7s ease-in-out infinite",
        "badge-shine": "badge-shine 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
