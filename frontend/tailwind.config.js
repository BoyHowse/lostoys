/** @type {import("tailwindcss").Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        foreground: "#f5f5f5",
        gold: "#d4af37",
        slate: {
          900: "#101012",
          950: "#08080a",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(212, 175, 55, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
