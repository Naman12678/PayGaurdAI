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
      {/* Hero — full-bleed backdrop spans the whole viewport width; the
          content column inside stays reading-width and centered. */}
      <section className="relative overflow-hidden w-full">
        {/* decorative color blobs — signal blue + agent violet, slow drift.
            Positioned against the full-width section, not the inner content
            column, so the color treatment actually reaches the screen edges
            instead of being boxed into the centered max-w-6xl column. */}
        <div className="blob w-[28rem] h-[28rem] bg-signal/20 -top-32 -left-32 animate-float" aria-hidden="true" />
        <div className="blob w-96 h-96 bg-agent/20 top-10 -right-20 animate-float-slow" aria-hidden="true" />
        <div className="blob w-80 h-80 bg-pass/10 bottom-0 left-1/4 animate-float" aria-hidden="true" />

        <div className="section !pt-14 sm:!pt-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <p className="eyebrow mb-4">For agent-driven commerce</p>
              <h1 className="text-4xl sm:text-5xl font-display font-semibold text-text leading-[1.1] tracking-tight mb-5">
                Let AI agents shop for your store.
                <br />
                <span className="bg-gradient-to-r from-signal-bright to-agent-bright bg-clip-text text-transparent">
                  Never let them touch the money.
                </span>
              </h1>
              <p className="text-text-muted text-lg leading-relaxed mb-8 max-w-lg">
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

            <div className="flex justify-center lg:justify-end animate-fade-up delay-200">
              <GateAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section border-t border-ink-line">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text mb-12 max-w-xl">
          Three deterministic steps between a request and a rupee moving.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="font-display font-mono text-3xl bg-gradient-to-br from-signal-bright to-agent-bright bg-clip-text text-transparent mb-3">
                {s.n}
              </div>
              <h3 className="text-text font-semibold mb-2">{s.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="section border-t border-ink-line">
        <p className="eyebrow mb-3">Why a gate, not a prompt</p>
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text mb-12 max-w-xl">
          Most agent-checkout demos trust the model. This one doesn&apos;t have to.
        </h2>

        <div className="card card-hover !p-0 overflow-hidden">
          <div className="grid grid-cols-3 text-sm">
            <div className="p-4 border-b border-ink-line"></div>
            <div className="p-4 border-b border-ink-line border-l border-ink-line text-text-faint font-medium font-mono text-xs uppercase tracking-wide">Prompt-only</div>
            <div className="p-4 border-b border-ink-line border-l border-ink-line text-signal-bright font-medium font-mono text-xs uppercase tracking-wide">PayGuard AI</div>
            {COMPARE.map((row) => (
              <React.Fragment key={row.label}>
                <div className="p-4 border-b border-ink-line text-text text-sm">{row.label}</div>
                <div className="p-4 border-b border-ink-line border-l border-ink-line text-text-faint text-sm">
                  {row.risky}
                </div>
                <div className="p-4 border-b border-ink-line border-l border-ink-line text-pass text-sm">
                  {row.safe}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Stack + buildathon */}
      <section className="section border-t border-ink-line">
        <div className="card card-hover flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 justify-between">
          <div>
            <p className="eyebrow mb-2">Built for</p>
            <h3 className="text-text font-display font-semibold text-lg">
              Razorpay AI Buildathon — Track 01: Agentic Commerce
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK.map((t) => (
              <span key={t} className="text-xs font-mono text-text-muted bg-ink border border-ink-line rounded-full px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-tight border-t border-ink-line text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text mb-4">
          Wire it up in an afternoon.
        </h2>
        <p className="text-text-muted mb-8">
          Test-mode Razorpay, a starter catalog seeded on signup, and a working policy gate —
          ready to try without touching production.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/signup" className="btn-primary">
            Create an account
          </Link>
          <Link to="/resources" className="btn-secondary">
            Read more
          </Link>
        </div>
      </section>
    </>
  );
}
