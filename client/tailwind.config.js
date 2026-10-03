/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        ink: '#202622',
        moss: '#426b56',
        canvas: '#f3f5f2',
      },
      boxShadow: {
        panel: '0 12px 40px rgba(35, 51, 41, 0.08)',
      },
    },
  },
  plugins: [],
}