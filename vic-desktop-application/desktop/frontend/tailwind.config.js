/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-card-bg': '#171717',
        'light-card-bg': '#ffffff',
      },
    },
  },
  plugins: [],
}
