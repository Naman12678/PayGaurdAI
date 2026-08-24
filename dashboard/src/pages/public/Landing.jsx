import React from 'react';
import { Link } from 'react-router-dom';
import GateAnimation from '../../components/GateAnimation.jsx';

const STEPS = [
  {
    n: '01',
    title: 'A buyer agent sends an intent',
    body: 'Any LLM-based shopping assistant can describe what it wants in plain language — no special integration required beyond a standard HTTP call.',
  },
  {
    n: '02',
    title: 'The gate checks it, deterministically',
    body: 'Amount cap, SKU allow-list, session limit. Plain code, not a prompt — so the same order always gets the same verdict.',
  },
  {
    n: '03',
    title: 'Only a pass reaches Razorpay',
    body: 'The agent never holds a Razorpay credential. A blocked order never places a payment — and every outcome, pass or block, is logged.',
  },
];

const COMPARE = [
  {
    label: 'Where spend limits live',
    risky: 'Inside the LLM\u2019s system prompt',
    safe: 'Deterministic code in core-api',
  },
  {
    label: 'What the agent can touch',
    risky: 'Database and payment credentials',
    safe: 'Nothing — HTTP calls only, no secrets',
  },
  {
    label: 'A blocked request',
    risky: 'May still reach the payment API',
    safe: 'Never reaches Razorpay at all',
  },
  {
    label: 'After something goes wrong',
    risky: 'No record of what the agent decided',
    safe: 'Full audit trail: intent → verdict → outcome',
  },
];

const STACK = ['Node.js + Express', 'LangGraph.js', 'Groq / Gemini', 'PostgreSQL + Prisma', 'Razorpay (test mode)', 'Docker'];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="section !pt-14 sm:!pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-4">For AI-driven commerce</p>
            <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white leading-[1.1] tracking-tight mb-5">
              Let AI agents shop for your store.
              <br />
              Never let them touch the money.
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
              PayGuard AI sits between any buyer agent and your Razorpay account. A deterministic
              policy gate checks every order before a rupee moves — the LLM only ever gets a
              verdict back.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary">
                Get started free
              </Link>
              <Link to="/resources" className="btn-secondary">
                See how it works
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <GateAnimation />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section border-t border-gray-900">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-12 max-w-xl">
          Three deterministic steps between a request and a rupee moving.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="font-display text-3xl text-gray-700 mb-3">{s.n}</div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="section border-t border-gray-900">
        <p className="eyebrow mb-3">Why a gate, not a prompt</p>
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-12 max-w-xl">
          Most agent-checkout demos trust the model. This one doesn&apos;t have to.
        </h2>

        <div className="card !p-0 overflow-hidden">
          <div className="grid grid-cols-3 text-sm">
            <div className="p-4 border-b border-gray-800 text-gray-500 font-medium"></div>
            <div className="p-4 border-b border-gray-800 border-l border-gray-800 text-gray-500 font-medium">Prompt-only</div>
            <div className="p-4 border-b border-gray-800 border-l border-gray-800 text-razorpay-blue font-medium">PayGuard AI</div>
            {COMPARE.map((row) => (
              <React.Fragment key={row.label}>
                <div className="p-4 border-b border-gray-800 text-gray-300 text-sm">{row.label}</div>
                <div className="p-4 border-b border-gray-800 border-l border-gray-800 text-gray-500 text-sm">
                  {row.risky}
                </div>
                <div className="p-4 border-b border-gray-800 border-l border-gray-800 text-green-300 text-sm">
                  {row.safe}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Stack + buildathon */}
      <section className="section border-t border-gray-900">
        <div className="card flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 justify-between">
          <div>
            <p className="eyebrow mb-2">Built for</p>
            <h3 className="text-white font-display font-semibold text-lg">
              Razorpay AI Buildathon — Track 01: Agentic Commerce
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK.map((t) => (
              <span key={t} className="text-xs font-mono text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-tight border-t border-gray-900 text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-4">
          Wire it up in an afternoon.
        </h2>
        <p className="text-gray-400 mb-8">
          Test-mode Razorpay, a seeded demo catalog, and a working policy gate — ready to try
          without touching production.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/signup" className="btn-primary">
            Create an account
          </Link>
          <Link to="/resources" className="btn-secondary">
            Read the docs
          </Link>
        </div>
      </section>
    </>
  );
}
