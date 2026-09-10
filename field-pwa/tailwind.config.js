/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1e293b', light: '#334155' },
        saffron: { DEFAULT: '#f59e0b', dark: '#d97706' },
        field: { green: '#16a34a', red: '#dc2626', amber: '#d97706' }
      },
      fontSize: {
        // Larger base sizes for outdoor readability
        'field-sm': ['15px', '22px'],
        'field-base': ['17px', '26px'],
        'field-lg': ['20px', '30px'],
        'field-xl': ['24px', '34px']
      },
      minHeight: { touch: '48px' },
      borderRadius: { field: '10px' }
    }
  },
  plugins: []
};
