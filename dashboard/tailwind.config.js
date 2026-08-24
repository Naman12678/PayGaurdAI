/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        razorpay: {
          blue: '#2E6FF2',
          dark: '#0D1117',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
