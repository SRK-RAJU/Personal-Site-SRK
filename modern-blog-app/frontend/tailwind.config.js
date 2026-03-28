module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        secondary: '#64748b',
        accent: '#06b6d4',
        'accent-light': '#cffafe',
        neon: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#10b981',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': `
          linear-gradient(135deg, #06b6d4 0%, #3b82f6 25%, #a855f7 50%, #ec4899 75%, #06b6d4 100%)
        `,
        'gradient-futuristic': `
          linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 25%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 75%, rgba(6, 182, 212, 0.1) 100%)
        `,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite',
        'cyber-pulse': 'cyber-pulse 1.5s ease-in-out infinite',
        'grid-flow': 'grid-flow 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { 'box-shadow': '0 0 5px rgba(6, 182, 212, 0.5)' },
          '50%': { 'box-shadow': '0 0 20px rgba(6, 182, 212, 0.8)' },
        },
        'neon-glow': {
          '0%, 100%': { 'box-shadow': '0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { 'box-shadow': '0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        'cyber-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'grid-flow': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 60px' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#1e293b',
            a: {
              color: '#06b6d4',
              '&:hover': {
                color: '#0891b2',
              },
            },
            'h1,h2,h3,h4': {
              color: '#0f172a',
            },
            code: {
              color: '#ec4899',
              backgroundColor: '#f1f5f9',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
            },
            pre: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              borderLeft: '4px solid #06b6d4',
            },
          },
        },
        dark: {
          css: {
            color: '#e2e8f0',
            a: {
              color: '#06b6d4',
              '&:hover': {
                color: '#22d3ee',
              },
            },
            'h1,h2,h3,h4': {
              color: '#f1f5f9',
            },
            code: {
              color: '#fca5a5',
              backgroundColor: '#1e293b',
            },
            pre: {
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              borderLeft: '4px solid #06b6d4',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
  darkMode: 'class',
};

