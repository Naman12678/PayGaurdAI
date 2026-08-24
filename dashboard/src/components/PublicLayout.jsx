import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/resources', label: 'Resources' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <svg width="24" height="24" viewBox="0 0 32 32" className="shrink-0">
        <rect width="32" height="32" rx="8" fill="#0D1117" />
        <rect x="8" y="8" width="16" height="16" rx="4" fill="none" stroke="#2E6FF2" strokeWidth="2.5" />
        <path d="M12.5 16.5l2.5 2.5 4.5-5" fill="none" stroke="#2E6FF2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display font-semibold text-white tracking-tight">PayGuard AI</span>
    </Link>
  );
}

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/90 backdrop-blur z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-6">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-link">
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/app/audit" className="btn-primary text-sm !py-1.5">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary text-sm !py-1.5">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-400 p-1"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-gray-800 px-4 py-3 flex flex-col gap-3">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-link" onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="h-px bg-gray-800 my-1" />
            {isAuthenticated ? (
              <Link to="/app/audit" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="font-display font-medium text-gray-300">PayGuard AI</span>
            <span aria-hidden="true">·</span>
            <span>Built for the Razorpay AI Buildathon</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/resources" className="nav-link">Resources</Link>
            <Link to="/privacy" className="nav-link">Privacy policy</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="nav-link"
            >
              GitHub ↗
            </a>
          </div>
        </div>
        <div className="border-t border-gray-900 py-3 text-center text-xs text-gray-600">
          Track 01: AI Growth &amp; Agentic Commerce · Razorpay test mode only · No real transactions
        </div>
      </footer>
    </div>
  );
}
