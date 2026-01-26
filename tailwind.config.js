/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.html",
    "./src/**/*.{js,ts}",
    "./assets/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        'gold-light': '#F1D78A',
        'gold-dark': '#AA8C2C',
        'black-rich': '#0a0a0a',
        'gray-dark': '#1a1a1a',
        'cream': '#F5F5DC',
        'brown-dark': '#1a1510'
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}