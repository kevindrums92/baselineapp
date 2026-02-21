/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#18B7B0",
          50: "#E6F9F8",
          100: "#CCF3F1",
          200: "#99E7E3",
          300: "#66DBD5",
          400: "#33CFC7",
          500: "#18B7B0",
          600: "#139289",
          700: "#0E6D67",
          800: "#094844",
          900: "#052322",
        },
      },
    },
  },
  plugins: [],
};
