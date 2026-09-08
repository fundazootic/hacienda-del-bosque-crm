/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verdes de bosque vallecaucano — color institucional
        bosque: {
          50: '#EEF3EF',
          100: '#D7E3DA',
          200: '#AFC7B6',
          300: '#7FAA92',
          400: '#4E8567',
          500: '#33684E',
          600: '#26503C',
          700: '#1D3A2C',
          800: '#16281F',
          900: '#0E1B15',
        },
        // Latón / dorado envejecido — acentos de lujo
        laton: {
          100: '#F3E9CE',
          200: '#E6D3A4',
          300: '#DCC48D',
          400: '#C9A961',
          500: '#B08D3C',
          600: '#8A6B22',
          700: '#6B5219',
        },
        // Crema / papel de hacienda — fondos
        crema: {
          50: '#FBF9F4',
          100: '#F5F1E7',
          200: '#EBE4D4',
          300: '#DCD3BE',
        },
        carbon: '#23231F',
        terracota: '#A9553C',
        salvia: '#8FA396',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        marca: '0.28em',
      },
      boxShadow: {
        suave: '0 1px 2px rgba(35,35,31,0.04), 0 8px 24px -12px rgba(35,35,31,0.14)',
        elevada: '0 24px 60px -30px rgba(14,27,21,0.45)',
      },
      backgroundImage: {
        'trama-hoja':
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%231D3A2C' stroke-opacity='0.05'%3E%3Cpath d='M30 6c8 10 8 26 0 42C22 32 22 16 30 6z'/%3E%3Cpath d='M30 10v36'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'fade-up': 'fade-up .45s ease-out both' },
    },
  },
  plugins: [],
}
