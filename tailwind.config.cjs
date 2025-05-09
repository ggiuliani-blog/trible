/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#f97316',
          600: '#ea580c',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'confetti': 'confetti 3s ease-out forwards',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.3, transform: 'scale(0.5)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0)', opacity: 1 },
          '100%': { transform: 'translateY(1000px) rotate(720deg)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
} 