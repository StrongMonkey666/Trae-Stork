/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          light: '#2C5282',
          dark: '#152A45',
        },
        secondary: {
          DEFAULT: '#2C5282',
          light: '#3A6B9F',
          dark: '#1E3A5F',
        },
        gain: '#48BB78',
        loss: '#F56565',
        warning: '#ECC94B',
        background: '#0D1B2A',
        card: '#1B2838',
        'text-primary': '#E2E8F0',
        'text-secondary': '#A0AEC0',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
