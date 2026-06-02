/** @type {import('tailwindcss').Config} */

const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
const cssVar = name => Object.fromEntries(
  SCALE.map(n => [n, `rgb(var(--color-${name}-${n}) / <alpha-value>)`])
)

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white:  'rgb(var(--color-white) / <alpha-value>)',
        gray:   { ...cssVar('gray'), 950: 'rgb(var(--color-gray-950) / <alpha-value>)' },
        blue:   cssVar('blue'),
        indigo: cssVar('indigo'),
        green:  cssVar('green'),
        red:    cssVar('red'),
        orange: cssVar('orange'),
        purple: cssVar('purple'),
        pink:   cssVar('pink'),
        amber:  cssVar('amber'),
        teal:   cssVar('teal'),
        yellow: cssVar('yellow'),
        violet: cssVar('violet'),
        cyan:   cssVar('cyan'),
      },
    },
  },
  plugins: [],
}
