import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        arjuna: {
          navy: "#1A3460",
          "navy-light": "#23457c",
          "navy-dark": "#112240",
          coral: "#F35E50",
          "coral-hover": "#e04b3d",
          "coral-light": "#fee9e7",
          gold: "#F3BC6F",
          "gold-hover": "#e2a95c",
          "gold-light": "#fef6eb",
          pink: "#F9C5CB",
          "pink-light": "#fff2f4",
          cream: "#FFF8F3",
          "cream-dark": "#f5ece3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
