/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{css}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-light": "var(--color-surface-light)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
      },
      borderRadius: {
        xl: "var(--radius)",
      },
      boxShadow: {
        glow: "0 0 25px rgba(0, 246, 199, 0.4)",
      },
      transitionProperty: {
        smooth: "all 0.3s ease",
      },
    },
  },
  plugins: [],
}

