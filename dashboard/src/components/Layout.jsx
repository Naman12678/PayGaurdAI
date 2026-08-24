import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/app/checkout', label: 'Checkout Demo' },
  { to: '/app/audit',    label: 'Audit Trail'   },
  { to: '/app/policy',   label: 'Policy Config' },
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
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="text-xl font-display font-bold text-white">PayGuard AI</Link>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded hidden sm:inline">
              Razorpay AI Buildathon
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
                      ? 'bg-razorpay-blue text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {merchant && (
              <span className="text-xs text-gray-500 hidden md:inline">{merchant.name}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
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

      <footer className="border-t border-gray-800 py-3 text-center text-xs text-gray-600">
        Track 01: AI Growth &amp; Agentic Commerce · Test mode only · No real transactions
      </footer>
    </div>
  );
}
