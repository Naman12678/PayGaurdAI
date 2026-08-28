import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      className={`relative w-9 h-9 rounded-lg border border-ink-line bg-ink-raised hover:bg-ink-line
                  flex items-center justify-center transition-all duration-200 active:scale-90 overflow-hidden ${className}`}
    >
      <svg
        className={`absolute w-4 h-4 text-retry transition-all duration-300 ${
          isLight ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
        viewBox="0 0 24 24" fill="none"
      >
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        />
      </svg>
      <svg
        className={`absolute w-4 h-4 text-signal-bright transition-all duration-300 ${
          isLight ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
        viewBox="0 0 24 24" fill="none"
      >
        <path
          d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
