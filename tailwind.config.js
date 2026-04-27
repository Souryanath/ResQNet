/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        head: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: { DEFAULT: '#0a0c10', 2: '#111420', 3: '#181c27' },
        card: { DEFAULT: '#151820', 2: '#1c2030' },
        crisis: { DEFAULT: '#E63946', dark: '#b02530' },
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'slide-in-right': 'slide-in-right .4s cubic-bezier(.22,1,.36,1) both',
        'slide-up': 'slide-up .4s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
}
