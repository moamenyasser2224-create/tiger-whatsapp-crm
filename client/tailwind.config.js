/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          50: '#f9f9f9',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d1d1d1',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#111111',
          950: '#0a0a0a',
        },
        brand: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d1d1d1',
          300: '#a3a3a3',
          400: '#737373',
          500: '#111111',
          600: '#111111',
          700: '#111111',
          800: '#111111',
          900: '#111111',
          950: '#0a0a0a',
        },
        whatsapp: {
          light: '#262626',
          DEFAULT: '#111111',
          dark: '#000000',
        }
      },
      fontFamily: {
        ledger: ['"IBM Plex Sans Arabic"', 'sans-serif'],
        display: ['"Reem Kufi"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'solid-sm': '2px 2px 0px 0px #111111',
        'solid': '4px 4px 0px 0px #111111',
        'solid-lg': '6px 6px 0px 0px #111111',
        'solid-dark': '4px 4px 0px 0px #ffffff',
      },
      borderRadius: {
        'none': '0px',
        'sharp': '0px',
        'control': '2px',
      },
    },
  },
  plugins: [],
}
