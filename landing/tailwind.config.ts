import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          50: '#f0f5fa',
          100: '#dce8f3',
          200: '#bfd4e9',
          300: '#93b6d9',
          400: '#6090c2',
          500: '#4070a8',
          600: '#335a8d',
          700: '#1e3a5f',
          800: '#1a3352',
          900: '#162b45',
        },
        accent: {
          DEFAULT: '#d4a853',
          50: '#fdf9ef',
          100: '#faf0d5',
          200: '#f4dfab',
          300: '#edc876',
          400: '#e5ad49',
          500: '#d4a853',
          600: '#c4872a',
          700: '#a36824',
          800: '#855324',
          900: '#6e4521',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
