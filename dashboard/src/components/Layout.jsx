import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/checkout', label: 'Checkout Demo' },
  { to: '/audit',    label: 'Audit Trail'   },
  { to: '/policy',   label: 'Policy Config' },
  { to: '/catalog',  label: 'Catalog'       },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white">Agent-Ready Checkout</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              Razorpay AI Buildathon
            </span>
          </div>
          <nav className="flex gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-lg transition-colors ${
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
