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
        surface: "#171717",
        "surface-2": "#262626",
        "surface-3": "#404040",
      },
    },
  },
  plugins: [],
};
