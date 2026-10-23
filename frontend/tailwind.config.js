/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D1E',
          900: '#0B1528',
          800: '#112240',
          700: '#1B325F',
          600: '#264882',
        },
        slate: {
          850: '#172033',
        },
        brand: {
          blue: '#2563EB',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          indigo: '#6366F1'
        },
        arthasetu: {
          border1: 'var(--color-border-1)',
          muted2: 'var(--color-muted-2)',
          bgDark: 'var(--color-background-3)',
          primary4: 'var(--color-primary-4)',
          border5: 'var(--color-border-5)',
          border6: 'var(--color-border-6)',
          border7: 'var(--color-border-7)',
          surface8: 'var(--color-surface-8)',
          primary9: 'var(--color-primary-9)',
          primary10: 'var(--color-primary-10)',
          muted11: 'var(--color-muted-11)',
          surface12: 'var(--color-surface-12)',
          border13: 'var(--color-border-13)',
          border14: 'var(--color-border-14)',
          border15: 'var(--color-border-15)',
          border16: 'var(--color-border-16)',
          primary17: 'var(--color-primary-17)',
          border18: 'var(--color-border-18)',
          primary19: 'var(--color-primary-19)',
          success20: 'var(--color-success-20)',
          danger21: 'var(--color-danger-21)',
          danger22: 'var(--color-danger-22)',
          surface23: 'var(--color-surface-23)',
          surface24: 'var(--color-surface-24)',
          surface25: 'var(--color-surface-25)',
          surface26: 'var(--color-surface-26)',
          surface27: 'var(--color-surface-27)',
          bgOverlay28: 'var(--color-background-28)',
        }
      },
      spacing: {
        'as-1': 'var(--space-1)',
        'as-2': 'var(--space-2)',
        'as-3': 'var(--space-3)',
        'as-4': 'var(--space-4)',
        'as-5': 'var(--space-5)',
        'as-6': 'var(--space-6)',
        'as-7': 'var(--space-7)',
        'as-8': 'var(--space-8)',
        'as-9': 'var(--space-9)',
        'as-10': 'var(--space-10)',
        'as-11': 'var(--space-11)',
      },
      borderRadius: {
        'as-1': 'var(--radius-1)',
        'as-2': 'var(--radius-2)',
        'as-3': 'var(--radius-3)',
        'as-4': 'var(--radius-4)',
        'as-5': 'var(--radius-5)',
      },
      boxShadow: {
        'as-1': 'var(--shadow-1)',
        'as-2': 'var(--shadow-2)',
        'as-3': 'var(--shadow-3)',
        'as-4': 'var(--shadow-4)',
        'as-5': 'var(--shadow-5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        flowDash: {
          'to': { strokeDashoffset: '-20' }
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flowDash 1s linear infinite'
      }
    },
  },
  plugins: [],
}
