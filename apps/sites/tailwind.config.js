/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sites)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sites)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0f1c',
          soft: '#141b2d',
          muted: '#64748b',
        },
        mist: {
          DEFAULT: '#f5f7fb',
          deep: '#e7edf6',
        },
        sky: {
          DEFAULT: '#3b9eff',
          soft: '#7cc4ff',
          deep: '#1d7fe0',
        },
        coral: {
          DEFAULT: '#f07167',
          soft: '#ff9a90',
          deep: '#e0554c',
        },
        accent: {
          DEFAULT: '#3b9eff',
          soft: '#7cc4ff',
          deep: '#1d7fe0',
        },
      },
      boxShadow: {
        glass: '0 10px 40px rgba(10, 15, 28, 0.1)',
        card: '0 16px 48px rgba(10, 15, 28, 0.1)',
        float: '0 20px 50px rgba(10, 15, 28, 0.14)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-18px) translateX(8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)' },
          '50%': { transform: 'translateY(22px) translateX(-12px) scale(1.05)' },
        },
        'float-card': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 9s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        'float-card': 'float-card 5.5s ease-in-out infinite',
        shimmer: 'shimmer 8s ease infinite',
      },
      backdropBlur: {
        glass: '22px',
      },
    },
  },
  plugins: [],
}
