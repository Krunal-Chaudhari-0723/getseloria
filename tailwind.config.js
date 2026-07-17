/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Luxury dark palette
        luxury: {
          black:    '#0a0a0a',
          dark:     '#111111',
          burgundy: '#7B2D42',
          rose:     '#8A3048',
          gold:     '#C8A96E',
          goldLight:'#D4B896',
          cream:    '#F5F0EB',
          creamDark:'#EDE5DB',
        },
        // Keep amber intact for admin pages
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
