/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f6',
          100: '#d7deea',
          200: '#aebcd4',
          300: '#8195b8',
          400: '#4f6690',
          500: '#2c4266',
          600: '#1a2d4d',
          700: '#13213a',
          800: '#0f192c',
          900: '#0B1F3A',
          950: '#070f1d',
        },
        gold: {
          400: '#d4af6a',
          500: '#c19a4f',
          600: '#a8823c',
        },
        pos: '#1e8a5f',
        neg: '#c23b3b',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(11,31,58,0.08), 0 2px 8px -2px rgba(11,31,58,0.06)',
        card: '0 8px 30px -8px rgba(11,31,58,0.12)',
        glass: '0 8px 32px 0 rgba(11,31,58,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
