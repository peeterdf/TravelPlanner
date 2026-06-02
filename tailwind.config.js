/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(n => [
            n,
            `rgb(var(--color-gray-${n}) / <alpha-value>)`,
          ])
        ),
        blue: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(n => [
            n,
            `rgb(var(--color-blue-${n}) / <alpha-value>)`,
          ])
        ),
        indigo: {
          50:  'rgb(var(--color-indigo-50) / <alpha-value>)',
          200: 'rgb(var(--color-indigo-200) / <alpha-value>)',
          400: 'rgb(var(--color-indigo-400) / <alpha-value>)',
          500: 'rgb(var(--color-indigo-500) / <alpha-value>)',
          600: 'rgb(var(--color-indigo-600) / <alpha-value>)',
          700: 'rgb(var(--color-indigo-700) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
