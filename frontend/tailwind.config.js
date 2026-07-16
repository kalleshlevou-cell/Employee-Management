/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom harmonized colors for premium aesthetics
        brand: {
          50: '#f5f6ff',
          100: '#ebedff',
          200: '#dbe0ff',
          300: '#c2c9ff',
          400: '#a3abff',
          500: '#7c84ff',
          600: '#6366f1', // Indigo standard
          700: '#4f4ec7',
          800: '#403ea1',
          900: '#363483',
        }
      }
    },
  },
  plugins: [],
}
