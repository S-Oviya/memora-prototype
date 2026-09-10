/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f2f7f4',
          100: '#e3eee7',
          200: '#cadcd1',
          300: '#a3c2b0',
          400: '#75a289',
          500: '#4e8762',
          600: '#3a6b4c',
          700: '#2f553e',
          800: '#284533',
          900: '#22392b',
        },
        warm: {
          50: '#faf8f5',
          100: '#f5f0e9',
          200: '#eae0d2',
          300: '#dcceb8',
          400: '#cbb698',
          500: '#ba9e7c',
          600: '#a88665',
          700: '#8d6e53',
          800: '#735a46',
          900: '#5e4a3b',
        },
        terracotta: {
          50: '#fcf6f4',
          100: '#f7ebe6',
          200: '#efd5cb',
          300: '#e3b6a4',
          400: '#d58f75',
          500: '#ca6e4d',
          600: '#b85435',
          700: '#994328',
          800: '#7d3824',
          900: '#673121',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'elderly-sm': ['1.125rem', { lineHeight: '1.75rem' }],
        'elderly-base': ['1.25rem', { lineHeight: '1.875rem' }],
        'elderly-lg': ['1.5rem', { lineHeight: '2rem' }],
        'elderly-xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'elderly-2xl': ['2.25rem', { lineHeight: '2.75rem' }],
      }
    },
  },
  plugins: [],
}
