/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05080f",
          900: "#0a101f",
          850: "#0f1729",
          800: "#141f33",
        },
        aqua: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        frost: "rgba(255,255,255,0.06)",
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        sans: ["Instrument Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(20, 184, 166, 0.35)",
        card: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
        lift: "0 18px 40px rgba(5, 8, 15, 0.55)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "hero-mesh":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.12), transparent)",
        // Combined mesh + grid so both layers render (Tailwind background utilities don't stack).
        "premium-mesh":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.12), transparent), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
