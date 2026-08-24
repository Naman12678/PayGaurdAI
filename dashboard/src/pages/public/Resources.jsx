import React from 'react';

const ENDPOINTS = [
  { method: 'POST', path: '/auth/register', auth: 'none', desc: 'Create a merchant account. Returns a JWT + merchant profile.' },
  { method: 'POST', path: '/auth/login', auth: 'none', desc: 'Sign in with email + password. Returns a JWT + merchant profile.' },
  { method: 'GET', path: '/auth/me', auth: 'merchant JWT', desc: 'Confirms the current session and returns the merchant profile.' },
  { method: 'GET', path: '/.well-known/agent-catalog.json', auth: 'merchant JWT', desc: 'The merchant\u2019s active product catalog, agent-readable.' },
  { method: 'POST', path: '/match', auth: 'service token', desc: 'Deterministic catalog lookup by natural-language query. Called by agent-service.' },
  { method: 'POST', path: '/policy/check', auth: 'service token', desc: 'Returns a pass/block verdict and the specific rule that fired.' },
  { method: 'GET / PUT', path: '/policy', auth: 'merchant JWT', desc: 'Read or update the amount cap, SKU allow-list, and session limit.' },
  { method: 'POST', path: '/orders', auth: 'service token', desc: 'Places a Razorpay test-mode order after a pass verdict. Idempotent by key.' },
  { method: 'GET', path: '/audit', auth: 'merchant JWT', desc: 'The full audit trail for the authenticated merchant.' },
];

const LINKS = [
  { label: 'Razorpay AI Buildathon', href: 'https://razorpay.com', note: 'Track 01: AI Growth & Agentic Commerce' },
  { label: 'Razorpay test mode docs', href: 'https://razorpay.com/docs/payments/payments/test-mode/', note: 'How test-mode orders and cards work' },
  { label: 'GroqCloud docs', href: 'https://console.groq.com/docs', note: 'Primary LLM provider used by agent-service' },
  { label: 'LangGraph.js docs', href: 'https://langchain-ai.github.io/langgraphjs/', note: 'State graph orchestration framework' },
];

export default function Resources() {
  return (
    <div className="section">
      <p className="eyebrow mb-3">Resources</p>
      <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white mb-4">
        Docs, endpoints, and links
      </h1>
      <p className="text-gray-400 max-w-2xl mb-12">
        The real API surface, straight from the running service — not a marketing summary of it.
      </p>

      {/* Quick start */}
      <div className="card mb-12">
        <h2 className="text-white font-semibold mb-4">Quick start (self-hosted)</h2>
        <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto">
{`cp .env.example .env
# fill in POSTGRES_PASSWORD, RAZORPAY_KEY_ID/SECRET,
# GROQ_API_KEY, JWT_SECRET, INTERNAL_SERVICE_TOKEN

docker compose up --build
# open http://localhost:5173`}
        </pre>
      </div>

      {/* Endpoints */}
      <h2 className="text-xl font-semibold text-white mb-4">API endpoints</h2>
      <div className="card !p-0 overflow-hidden mb-12 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="p-3 font-medium">Method</th>
              <th className="p-3 font-medium">Path</th>
              <th className="p-3 font-medium">Auth</th>
              <th className="p-3 font-medium">What it does</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={e.path} className="border-b border-gray-800 last:border-0">
                <td className="p-3 font-mono text-razorpay-blue whitespace-nowrap">{e.method}</td>
                <td className="p-3 font-mono text-gray-300 whitespace-nowrap">{e.path}</td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{e.auth}</td>
                <td className="p-3 text-gray-400">{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* External links */}
      <h2 className="text-xl font-semibold text-white mb-4">External links</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="card hover:border-razorpay-blue/50 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-white font-medium text-sm">{l.label}</div>
              <div className="text-gray-500 text-xs mt-0.5">{l.note}</div>
            </div>
            <span className="text-gray-600">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
