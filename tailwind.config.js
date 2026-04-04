/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark Tech palette
        'bg-primary': '#050505',
        'bg-secondary': '#0a0a0a',
        'bg-elevated': '#111111',
        'bg-surface': '#1a1a1a',
        'border-default': '#1f1f1f',
        'border-hover': '#2a2a2a',
        'accent': '#FFB800',
        'accent-hover': '#FFCC33',
        'accent-secondary': '#FF6B00',
        'text-primary': '#F5F5F5',
        'text-secondary': '#999999',
        'text-tertiary': '#555555',
        'text-inverse': '#050505',
        // Legacy aliases (used in JSX still)
        'safety-lime': '#FFB800',
        'pure-black': '#050505',
        'cyan-accent': '#FF6B00',
        'bg-white': '#050505',
        'charcoal': '#0a0a0a',
        'gold': '#FFB800',
        'grey': '#111111',
      },
      fontFamily: {
        'sans': ['Geist', 'system-ui', 'sans-serif'],
        'mono': ['Geist Mono', 'Geist MonoVariable', 'monospace'],
        // Legacy aliases
        'syne': ['Geist', 'system-ui', 'sans-serif'],
        'jetbrains': ['Geist Mono', 'Geist MonoVariable', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        'elevated': '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        'glow-amber': '0 0 20px rgba(255,184,0,0.15), 0 0 60px rgba(255,184,0,0.05)',
        'glow-amber-lg': '0 0 40px rgba(255,184,0,0.25)',
        'glow-success': '0 0 20px rgba(34,197,94,0.2)',
        // Legacy - kept to avoid breakage
        'brutal': '0 0 20px rgba(255,184,0,0.15)',
        'brutal-lg': '0 0 40px rgba(255,184,0,0.25)',
        'brutal-hover': '0 0 10px rgba(255,184,0,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,184,0,0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(255,184,0,0.25)' },
        },
      },
    },
  },
  plugins: [],
}
