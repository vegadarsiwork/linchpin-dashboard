/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7c3cff",
          light: "#9d6fff",
          dark: "#6020e0",
        },
        highlight: "#c084fc",
        surface: {
          DEFAULT: "#260f26",
          2: "#251f47",
          3: "#2e2858",
          4: "#404e7c",
        },
      },
      fontFamily: {
        display: ['"ClashDisplay-Variable"', '"Clash Display"', "system-ui", "sans-serif"],
        body: ["Satoshi", "system-ui", "sans-serif"],
        sans: ["Satoshi", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
