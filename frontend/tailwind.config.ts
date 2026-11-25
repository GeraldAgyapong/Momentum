import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        forest: {
          DEFAULT: "#173B32",
          50: "#f0f6f4",
          100: "#dbeef5",
          200: "#b5dcd3",
          300: "#80beae",
          400: "#4f9c8a",
          500: "#2d7e6c",
          600: "#216456",
          700: "#1b5145",
          800: "#173B32", // Forest green
          900: "#122f28",
          950: "#091b17",
        },
        sage: {
          DEFAULT: "#DCE9DF",
          50: "#f7faf7",
          100: "#edf3ee",
          200: "#DCE9DF", // Sage
          300: "#bed6c3",
          400: "#9bbbA3",
          500: "#759e7f",
          600: "#5b8064",
          700: "#486650",
          800: "#3d5242",
          900: "#344538",
        },
        ivory: {
          DEFAULT: "#F6F4EE",
          50: "#fdfdfc",
          100: "#FAF9F5",
          200: "#F6F4EE", // Ivory
          300: "#ede8db",
          400: "#ded4c0",
          500: "#c7b79b",
          600: "#ad997b",
        },
        charcoal: {
          DEFAULT: "#252824",
          50: "#f6f6f6",
          100: "#e7e8e7",
          200: "#cfd0cf",
          300: "#a9aba8",
          400: "#7c807b",
          500: "#5c605a",
          600: "#474b45",
          700: "#393c37",
          800: "#2e312c",
          900: "#252824", // Charcoal
          950: "#141613",
        },
        gold: {
          DEFAULT: "#C5A36B",
          50: "#fbf8f3",
          100: "#f6f0e3",
          200: "#ede0c6",
          300: "#e0cca1",
          400: "#d3b57c",
          500: "#C5A36B", // Muted Gold
          600: "#ad8750",
          700: "#8c693e",
          800: "#725436",
          900: "#5e4530",
        },
        mutedGrey: {
          DEFAULT: "#858A82",
          50: "#f8f8f8",
          100: "#eff0ef",
          200: "#dedfe0",
          300: "#c3c5c4",
          400: "#a3a7a4",
          500: "#858A82", // Muted grey
          600: "#6a7068",
          700: "#535851",
          800: "#454843",
          900: "#3b3d39",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.875rem",
        md: "0.625rem",
        sm: "0.375rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(37, 40, 36, 0.05), 0 4px 6px -2px rgba(37, 40, 36, 0.03)",
        card: "0 4px 20px -2px rgba(23, 59, 50, 0.06), 0 2px 6px -1px rgba(23, 59, 50, 0.04)",
        elevated: "0 10px 30px -5px rgba(23, 59, 50, 0.1), 0 6px 10px -3px rgba(23, 59, 50, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
