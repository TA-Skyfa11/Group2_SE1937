/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6",
        "primary-dark": "#0d9488",
        "primary-light": "#2dd4bf",
        surface: "#ffffff",
        "surface-2": "#f1f3f6",
        "surface-3": "#e7e9ee",
      },
    },
  },
  plugins: [],
};
