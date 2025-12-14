/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // In Tailwind CSS v4, plugins are configured differently
  // and many animation features are built-in.
  plugins: [],
}