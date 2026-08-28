import React from 'react';

const LINKS = [
  { label: 'Razorpay AI Buildathon', href: 'https://razorpay.com', note: 'Track 01: AI Growth & Agentic Commerce' },
  { label: 'Razorpay test mode docs', href: 'https://razorpay.com/docs/payments/payments/test-mode/', note: 'How test-mode orders and cards work' },
];

export default function Resources() {
  return (
    <div className="section">
      <p className="eyebrow mb-3">Resources</p>
      <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text mb-4">
        Resources
      </h1>
      <p className="text-text-muted max-w-2xl mb-12">
        Background reading on the standards and tooling this project builds on. For a walkthrough
        of how PayGuard AI itself is put together, see the About page.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="card hover:border-signal/50 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-text font-medium text-sm">{l.label}</div>
              <div className="text-text-faint text-xs mt-0.5">{l.note}</div>
            </div>
            <span className="text-text-faint">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
