/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ink scale — a navy-charcoal base rather than a neutral gray-950,
        // so the app has its own identity instead of the default Tailwind dark.
        ink: {
          DEFAULT: '#090B10',
          raised: '#12151D',
          surface: '#161A24',
          line: '#242A38',
          line2: '#31384A',
        },
        text: {
          DEFAULT: '#EDEFF3',
          muted: '#8890A2',
          faint: '#5C6478',
        },
        // Primary signal — an indigo-blue, close cousin of Razorpay's brand
        // blue but tuned so it doesn't read as a stock Tailwind color.
        signal: {
          DEFAULT: '#4E6BFF',
          bright: '#7089FF',
          dim: '#2E3E99',
        },
        // Verdict palette — the vocabulary the whole product speaks in
        // (pass / block / retry), reused for badges, stamps, and status dots.
        pass: { DEFAULT: '#16C98D', dim: '#0E3D30' },
        block: { DEFAULT: '#FF5C72', dim: '#3D1620' },
        retry: { DEFAULT: '#F5B400', dim: '#3D2E06' },
        // Kept for any leftover references during the transition.
        razorpay: { blue: '#4E6BFF', dark: '#090B10' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, transparent, #090B10 92%), repeating-linear-gradient(0deg, transparent, transparent 39px, #1B2030 39px, #1B2030 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #1B2030 39px, #1B2030 40px)',
      },
    },
  },
  plugins: [],
};
