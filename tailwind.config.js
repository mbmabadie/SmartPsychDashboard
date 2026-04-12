/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#DDF0F8', 100: '#B8E0F0', 200: '#8CCDE6', 300: '#56B5DB', 400: '#28A1D1', 500: '#1197CC', 600: '#0E7BA8', 700: '#0B5F84', 800: '#084460', 900: '#052A3D' },
      },
      fontFamily: { sans: ['-apple-system', 'Segoe UI', 'Tahoma', 'sans-serif'] },
    },
  },
  plugins: [],
};
