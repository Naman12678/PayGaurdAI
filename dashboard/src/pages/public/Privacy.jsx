import React from 'react';

export default function Privacy() {
  return (
    <div className="section-tight">
      <p className="eyebrow mb-3">Privacy</p>
      <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white mb-3">
        Privacy policy
      </h1>
      <p className="text-text-faint text-sm mb-10">
        This is a buildathon demo project, not a commercial product. This page describes, plainly,
        what the running application actually stores and does — it is not a legal document.
      </p>

      <div className="prose-public">
        <h2>What&apos;s stored</h2>
        <ul>
          <li>Your account email, a bcrypt hash of your password (never the password itself), and the name you provide at sign-up.</li>
          <li>Any catalog, policy configuration, and checkout session data you create while using the demo.</li>
          <li>An audit log entry for every checkout request made under your account: the request text, the matched product, the policy verdict, and the outcome.</li>
        </ul>

        <h2>What&apos;s never stored</h2>
        <ul>
          <li>Real payment details. Razorpay runs in test mode only — no card numbers, no real transactions, no real money.</li>
          <li>Your password in plain text or in any reversible form.</li>
        </ul>

        <h2>Third parties involved</h2>
        <p>
          A checkout request&apos;s text is sent to Groq (and, on fallback, Google&apos;s Gemini) to
          interpret intent, and to Razorpay&apos;s test-mode API to simulate order creation. No data
          is sold, shared for advertising, or used to train models beyond what those providers&apos;
          own API terms describe.
        </p>

        <h2>Account isolation</h2>
        <p>
          Every table that holds merchant data — catalog, policy, sessions, audit log — is scoped
          to your account by a server-side check on every request. One account cannot read or
          modify another account&apos;s data.
        </p>

        <h2>Deleting your data</h2>
        <p>
          Since this is a demo environment, the simplest way to remove your data is to ask —
          this isn&apos;t yet backed by a self-service deletion flow.
        </p>
      </div>
    </div>
  );
}
