import { defineConfig } from "tailwindcss";

export default defineConfig({
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#dbecff",
          200: "#b6d9ff",
          300: "#8fc5ff",
          400: "#66b0ff",
          500: "#3d9aff",
          600: "#1d7fe5",
          700: "#1464b2",
          800: "#0d477f",
          900: "#072a4c",
        },
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: { float: "float 6s ease-in-out infinite" },
      boxShadow: { soft: "0 10px 25px -10px rgba(0,0,0,0.15)" },
    },
  },
  plugins: [],
});
