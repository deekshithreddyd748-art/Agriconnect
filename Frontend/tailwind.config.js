/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F7F4',
          100: '#D8EDE3',
          200: '#B5DBC9',
          500: '#2D6A4F',
          600: '#245841',
          700: '#1B4332',
          800: '#143326',
          900: '#0D2219',
        },
        fresh: {
          50: '#F2FAF4',
          100: '#DFF4E5',
          500: '#40916C',
          600: '#2F7D59',
        },
        earth: {
          50: '#FAF9F5',
          100: '#F3F0E6',
          200: '#E6E0CE',
          600: '#8C6239',
          700: '#6F4E2E',
        },
        harvest: {
          100: '#FEF3C7',
          600: '#D97706',
          700: '#B45309',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
