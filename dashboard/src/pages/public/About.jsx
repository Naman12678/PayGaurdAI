import React from 'react';

export default function About() {
  return (
    <div className="section-tight">
      <p className="eyebrow mb-3">About</p>
      <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white mb-8">
        Why PayGuard AI exists
      </h1>

      <div className="prose-public">
        <p>
          Most agent-checkout demos put the spending rules inside the AI model itself — a system
          prompt telling it what it&apos;s allowed to buy. That works until it doesn&apos;t: a prompt
          is not a security boundary, and a model that can be talked into a purchase can be talked
          into the wrong one.
        </p>
        <p>
          PayGuard AI takes a different approach. The AI agent — the part that reads a natural-language
          request like &ldquo;get me a wireless mouse under ₹800&rdquo; — never holds a database
          credential or a Razorpay key. It can only ask a separate, deterministic service a
          question and receive a verdict back. That service, not the model, is the one place spend
          limits, SKU allow-lists, and session caps actually live.
        </p>

        <h2>The architecture</h2>
        <p>
          Two backend services enforce this split. <code className="text-gray-300 font-mono text-sm">agent-service</code> runs
          the LangGraph orchestration and calls Groq (with Gemini as a fallback) to interpret intent.
          <code className="text-gray-300 font-mono text-sm"> core-api</code> owns PostgreSQL, the Razorpay
          integration, the policy engine, and the audit log — and is the only thing either of them
          can touch. A service-to-service token, separate from user authentication, is required for
          agent-service to call core-api at all.
        </p>
        <ul>
          <li>Every checkout attempt — passed, blocked, or failed — writes exactly one audit row.</li>
          <li>A blocked order never reaches Razorpay, by construction, not by convention.</li>
          <li>Merchant accounts are isolated: one merchant&apos;s catalog, policy, and audit trail are never visible to another.</li>
        </ul>

        <h2>Built for the Razorpay AI Buildathon</h2>
        <p>
          This project was built for Track 01 (AI Growth &amp; Agentic Commerce) of the Razorpay AI
          Buildathon, by Naman Sharma, a final-year Computer Science student. Everything runs against
          Razorpay&apos;s test mode — no real transactions are processed anywhere in this system.
        </p>
      </div>
    </div>
  );
}
