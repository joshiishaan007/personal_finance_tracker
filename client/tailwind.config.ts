import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81',
        },
        success: { 50: '#ECFDF5', 500: '#10B981', 700: '#047857' },
        warn: { 50: '#FFFBEB', 500: '#F59E0B', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 500: '#EF4444', 700: '#B91C1C' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 150ms ease-out',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
