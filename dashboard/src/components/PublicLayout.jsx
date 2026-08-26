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
      <svg width="26" height="26" viewBox="0 0 32 32" className="shrink-0">
        <rect width="32" height="32" rx="7" fill="#12151D" stroke="#242A38" />
        <path
          d="M8 20V12a1 1 0 0 1 1-1h9.5a3.5 3.5 0 0 1 0 7H12v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1Z"
          fill="none"
          stroke="#7089FF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="9.5" r="2.5" fill="#16C98D" />
      </svg>
      <span className="font-display font-semibold text-text tracking-tight">PayGuard AI</span>
    </Link>
  );
}

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-ink text-text">
      <header className="border-b border-ink-line sticky top-0 bg-ink/90 backdrop-blur z-20">
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
            className="md:hidden text-text-muted p-1"
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
          <div className="md:hidden border-t border-ink-line px-4 py-3 flex flex-col gap-3">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-link" onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="h-px bg-ink-line my-1" />
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

      <footer className="border-t border-ink-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-text-faint text-sm">
            <span className="font-display font-medium text-text-muted">PayGuard AI</span>
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
        <div className="border-t border-ink-line py-3 text-center text-xs text-text-faint font-mono">
          Track 01 · AI Growth &amp; Agentic Commerce · Razorpay test mode only · No real transactions
        </div>
      </footer>
    </div>
  );
}
