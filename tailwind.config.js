/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'safety-lime': '#DFFF00',
        'pure-black': '#000000',
        'cyan-accent': '#00F2FF',
        'bg-white': '#FFFFFF',
        'charcoal': '#0A0A0A',
        'cyan': '#00F2FF',
        'gold': '#FFB800',
        'grey': '#111111',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-hover': '2px 2px 0px 0px #000000',
      },
    },
  },
  plugins: [],
}
