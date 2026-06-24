/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/providers/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F7F8FB',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#07152F',
        muted: '#64748B',
        navy: '#0B2E6F',
        blue: '#0057D9',
        'blue-soft': '#EAF2FF',
        green: '#16A34A',
        'green-soft': '#E7F6EC',
        orange: '#F59E0B',
        'orange-soft': '#FEF3E0',
        red: '#E53935',
        'red-soft': '#FDECEC',
        purple: '#7C5BD9',
        'purple-soft': '#F1ECFD',
        pink: '#E94B7B',
        'pink-soft': '#FDE7EF',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04)',
      },
    },
  },
  plugins: [],
};
