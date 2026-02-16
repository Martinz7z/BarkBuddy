/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6B8E23",
        secondary: "#F5F1E3",
        accent: "#F4A259",
        muted: "#555B6E",
      },
      fontFamily: {
        primary: ["Poppins", "sans-serif"],
        heading: ["Raleway", "sans-serif"],
      },
    },
  },
  plugins: [],
};
