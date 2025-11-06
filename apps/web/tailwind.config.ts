import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          dawn: "hsl(23 85% 92%)",
          day: "hsl(196 89% 92%)",
          dusk: "hsl(268 83% 90%)",
          night: "hsl(240 33% 12%)"
        }
      }
    }
  },
  plugins: []
};

export default config;
