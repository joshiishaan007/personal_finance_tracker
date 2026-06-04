import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary accent — mode-driven (steel blue in Finance, teal in Goals).
        // Values come from CSS vars (see globals.css) so [data-mode] swaps them all.
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          950: 'rgb(var(--brand-950) / <alpha-value>)',
        },
        // Secondary accent — neutral slate-steel
        accent: {
          50: '#F5F7FA', 100: '#E9EDF3', 200: '#D4DBE6', 300: '#B0BCCE',
          400: '#8595AE', 500: '#647391', 600: '#4D5B77', 700: '#3E4960',
          800: '#353D50', 900: '#2F3544', 950: '#1E222C',
        },
        // Tertiary accent — cyan
        aqua: {
          50: '#ECFEFF', 100: '#CFFAFE', 200: '#A5F3FC', 300: '#67E8F9',
          400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2', 700: '#0E7490',
          800: '#155E75', 900: '#164E63', 950: '#083344',
        },
        success: {
          50: '#E7FBF3', 100: '#C7F5E4', 200: '#9EEFD2', 300: '#63E6BC',
          400: '#34D9A4', 500: '#22D3A7', 600: '#12B88C', 700: '#0E8E6C',
          800: '#0B6E54', 900: '#085240', 950: '#03291F',
        },
        warn: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          800: '#92400E', 900: '#78350F', 950: '#451A03',
        },
        danger: {
          50: '#FEF2F3', 100: '#FDE2E4', 200: '#FECACF', 300: '#FDA4AD',
          400: '#FB7185', 500: '#FB5C6B', 600: '#E11D48', 700: '#BE123C',
          800: '#9F1239', 900: '#881337', 950: '#4C0519',
        },
        // Dark-mode surfaces (Aurora "ink")
        ink: {
          950: '#0B0B14', 900: '#14141F', 850: '#1A1A28', 800: '#20202F',
          700: '#2A2A3C', 600: '#3A3A50', 500: '#4B4B66',
        },
      },
      backgroundImage: {
        'aurora': 'linear-gradient(135deg, rgb(var(--grad-a)) 0%, rgb(var(--grad-b)) 60%, rgb(var(--grad-c)) 100%)',
        'aurora-soft': 'linear-gradient(135deg, rgb(var(--grad-a) / 0.12), rgb(var(--grad-b) / 0.12), rgb(var(--grad-c) / 0.10))',
        'brand-grad': 'linear-gradient(135deg, rgb(var(--brand-500)) 0%, rgb(var(--brand-600)) 100%)',
        'mint-grad': 'linear-gradient(135deg, #34D9A4 0%, #06B6D4 100%)',
        'flame-grad': 'linear-gradient(135deg, #FBBF24 0%, #FB5C6B 100%)',
        'glow-radial': 'radial-gradient(60% 60% at 50% 0%, rgb(var(--glow) / 0.22), transparent 70%)',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(2,6,23,0.04), 0 6px 16px -4px rgba(2,6,23,0.08)',
        'card-lg': '0 12px 40px -8px rgba(2,6,23,0.18)',
        'glow': '0 0 0 1px rgb(var(--glow) / 0.22), 0 10px 34px -8px rgb(var(--glow) / 0.45)',
        'glow-mint': '0 10px 34px -8px rgba(34,211,167,0.5)',
        'glow-danger': '0 10px 34px -8px rgba(251,92,107,0.5)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 250ms cubic-bezier(0.22,1,0.36,1)',
        'float': 'float 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.6s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'pop': 'pop 220ms cubic-bezier(0.22,1,0.36,1)',
        'fall': 'fall var(--fall-duration, 1s) ease-in var(--fall-delay, 0ms) forwards',
      },
      keyframes: {
        fall: { to: { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseGlow: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        gradientShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        pop: { from: { transform: 'scale(0.96)', opacity: '0.6' }, to: { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
