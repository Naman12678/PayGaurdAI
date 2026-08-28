import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const NAV = [
  { to: '/app/checkout', label: 'Checkout demo' },
  { to: '/app/audit',    label: 'Audit trail'   },
  { to: '/app/policy',   label: 'Policy config' },
  { to: '/app/catalog',  label: 'Catalog'       },
];

export default function Layout() {
  const { merchant, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-ink-line bg-ink-raised">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pass shrink-0" aria-hidden="true" />
              <span className="text-lg font-display font-semibold text-text tracking-tight">PayGuard AI</span>
            </Link>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-faint bg-ink px-2 py-0.5 rounded hidden sm:inline border border-ink-line">
              Test mode
            </span>
          </div>

          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-signal text-white'
                      : 'text-text-muted hover:text-text hover:bg-ink-line'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            {merchant && (
              <span className="text-xs text-text-faint hidden md:inline">{merchant.name}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-text-muted hover:text-text border border-ink-line hover:border-ink-line2 rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-ink-line py-3 text-center text-xs text-text-faint font-mono">
        Track 01 · AI Growth &amp; Agentic Commerce · Test mode only · No real transactions
      </footer>
    </div>
  );
}
