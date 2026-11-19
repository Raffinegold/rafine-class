/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        sunny: '#facc15',
        mint: '#34d399',
        coral: '#fb7185',
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(49, 46, 129, 0.25)',
        card: '0 18px 40px -20px rgba(49, 46, 129, 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        pop: 'pop 180ms ease-out',
        shake: 'shake 260ms ease-in-out',
        floaty: 'floaty 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
