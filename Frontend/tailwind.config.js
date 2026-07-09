/** @type {import('tailwindcss').Config} */
export default {
  content: [
  "./index.html",
  "./src/**/*.{js,jsx}"
],
  theme: {
    extend: {
      colors:{
        primary: "#FF6B35",
        secondary: "#F7931E",
        bgLight: "#FFF8F3",
        textDark: "#1F2937",
      },
    },
  },
  plugins: [],
}

