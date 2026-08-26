import React, { useEffect, useState } from 'react';

const SCENARIOS = [
  {
    intent: '"Get me a wireless mouse under ₹800"',
    outcome: 'pass',
    rule: 'within amount cap · SKU allowed',
    result: 'Razorpay order placed',
  },
  {
    intent: '"Buy the 24-inch monitor"',
    outcome: 'block',
    rule: 'SKU not on allow-list',
    result: 'no payment · logged',
  },
  {
    intent: '"I want the portable SSD"',
    outcome: 'block',
    rule: 'amount exceeds session cap',
    result: 'no payment · logged',
  },
];

export default function GateAnimation() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    const cycle = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SCENARIOS.length);
        setFading(false);
      }, 250);
    }, 3400);
    return () => clearInterval(cycle);
  }, []);

  const s = SCENARIOS[index];
  const pass = s.outcome === 'pass';

  return (
    <div className="card-raised !p-5 sm:!p-8 w-full max-w-xl relative overflow-hidden">
      {/* faint ledger-rule background, reinforcing the audit-log motif */}
      <div className="absolute inset-0 ledger-rail opacity-40 pointer-events-none" aria-hidden="true" />

      <div className={`relative flex items-center justify-between gap-2 sm:gap-4 transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Agent */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint mb-1.5">Buyer agent</div>
          <div className="bg-ink border border-ink-line rounded-lg px-3 py-2.5 text-xs text-text leading-snug h-16 flex items-center">
            {s.intent}
          </div>
        </div>

        {/* Arrow in */}
        <svg className="w-5 h-5 shrink-0 text-ink-line2 mt-5" viewBox="0 0 24 24" fill="none">
          <path d="M4 12h15m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Gate */}
        <div className="shrink-0 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint mb-1.5">Policy gate</div>
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center transition-colors duration-300 ${
              pass ? 'border-pass bg-pass-dim/40' : 'border-block bg-block-dim/40'
            }`}
          >
            {pass ? (
              <svg className="w-6 h-6 text-pass" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-block" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Arrow out */}
        <svg className="w-5 h-5 shrink-0 text-ink-line2 mt-5" viewBox="0 0 24 24" fill="none">
          <path d="M4 12h15m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Result */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint mb-1.5">core-api</div>
          <div
            className={`rounded-lg px-3 py-2.5 text-xs leading-snug h-16 flex items-center border ${
              pass ? 'border-pass/40 bg-pass-dim/20 text-pass' : 'border-block/40 bg-block-dim/20 text-block'
            }`}
          >
            {s.result}
          </div>
        </div>
      </div>

      <div className={`relative mt-5 pt-4 border-t border-ink-line flex items-center justify-between transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        <span className={pass ? 'stamp-pass' : 'stamp-block'}>{pass ? 'Verdict · Pass' : 'Verdict · Block'}</span>
        <span className="text-xs text-text-faint font-mono">{s.rule}</span>
      </div>
    </div>
  );
}
