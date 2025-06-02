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
        primary: {
          50: '#E8F2FF',
          100: '#D1E5FF',
          200: '#A3CBFF',
          300: '#75B1FF',
          400: '#4797FF',
          500: '#0A66C2', // LinkedIn Blue
          600: '#0E76A8', // Darker Blue
          700: '#0C5A8C',
          800: '#0A4D7A',
          900: '#084068',
        },
        secondary: {
          50: '#F9FAFB',
          100: '#F3F4F6', // Background
          200: '#E5E7EB', // Border
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280', // Text Secondary
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937', // Text Primary
          900: '#111827',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
      },
      spacing: {
        '4': '1rem',
      },
    },
  },
  plugins: [],
}