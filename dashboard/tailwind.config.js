/** @type {import('tailwindcss').Config} */
function themeColor(varName) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: themeColor('--c-ink'),
          raised:  themeColor('--c-ink-raised'),
          surface: themeColor('--c-ink-surface'),
          line:    themeColor('--c-ink-line'),
          line2:   themeColor('--c-ink-line2'),
        },
        text: {
          DEFAULT: themeColor('--c-text'),
          muted:   themeColor('--c-text-muted'),
          faint:   themeColor('--c-text-faint'),
        },
        // Primary signal — the "money/gate" accent.
        signal: {
          DEFAULT: themeColor('--c-signal'),
          bright:  themeColor('--c-signal-bright'),
          dim:     themeColor('--c-signal-dim'),
        },
        // Secondary accent — the "agent/LLM" side of the architecture,
        // reused wherever the buyer agent or agent-service shows up visually
        // so the two-container split reads as two colors, not just prose.
        agent: {
          DEFAULT: themeColor('--c-agent'),
          bright:  themeColor('--c-agent-bright'),
          dim:     themeColor('--c-agent-dim'),
        },
        pass:  { DEFAULT: themeColor('--c-pass'),  dim: themeColor('--c-pass-dim') },
        block: { DEFAULT: themeColor('--c-block'), dim: themeColor('--c-block-dim') },
        retry: { DEFAULT: themeColor('--c-retry'), dim: themeColor('--c-retry-dim') },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-up':   { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in':   { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'pop':       { '0%': { transform: 'scale(0.6)', opacity: 0 }, '60%': { transform: 'scale(1.08)', opacity: 1 }, '100%': { transform: 'scale(1)' } },
        'float':     { '0%, 100%': { transform: 'translate(0, 0)' }, '50%': { transform: 'translate(10px, -14px)' } },
        'float-slow':{ '0%, 100%': { transform: 'translate(0, 0)' }, '50%': { transform: 'translate(-16px, 12px)' } },
        'drift':     { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.5s ease both',
        'pop':     'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'float':      'float 7s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'drift':      'drift 40s linear infinite',
      },
    },
  },
  plugins: [],
};
