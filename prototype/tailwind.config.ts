import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F4F6F9",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
          light: "#DBEAFE",
        },
        navy: {
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
        },
        muted: "#64748B",
        borderSubtle: "#E2E8F0",
      },
      borderRadius: {
        squircle: "24px",
        "squircle-lg": "28px",
        "squircle-sm": "16px",
      },
      boxShadow: {
        soft: "0 2px 8px -1px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)",
        "soft-hover": "0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.03)",
        floating: "0 10px 25px -4px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
