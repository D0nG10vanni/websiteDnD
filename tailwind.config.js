/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        invert: {
          css: {
            color: theme("colors.gray.200"),
            a: {
              color: theme("colors.blue.400"),
              textDecoration: "underline",         // ← hier
              "&:hover": {
                color: theme("colors.blue.300"),
                textDecoration: "underline",
              },
            },
            h1: { color: theme("colors.white") },
            h2: { color: theme("colors.white") },
            h3: { color: theme("colors.white") },
            strong: { color: theme("colors.white") },
            code: {
              color: theme("colors.pink.400"),
              backgroundColor: theme("colors.gray.900"),
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
            },
            "pre code": {
              display: "block",
              padding: theme("spacing.4"),
              backgroundColor: theme("colors.gray.900"),
              borderRadius: theme("borderRadius.lg"),
            },
            blockquote: {
              color: theme("colors.gray.300"),
              borderLeftColor: theme("colors.blue.600"),
              fontStyle: "italic",
            },
            "ul > li::marker": { color: theme("colors.blue.400") },
            hr: { borderColor: theme("colors.gray.700") },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};