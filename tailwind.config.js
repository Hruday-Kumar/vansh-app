/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFBF7', // The primary "Khadi" background
          100: '#F2E8CF', // Aged paper
          200: '#E5E0D8', // Texture borders
        },
        ink: {
          900: '#2C241B', // Soft Black (Charcoal) - Never use pure #000
          500: '#594532', // Sepia text
        },
        saffron: '#D4A373', // Accent color (Gold/Saffron)
      },
      fontFamily: {
        serif: ['CrimsonText_400Regular'], // We will load this font later
      }
    },
  },
  plugins: [],
}