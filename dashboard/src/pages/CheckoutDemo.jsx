import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendCheckoutRequest } from '../api/agentApiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const SUGGESTIONS = [
  'I want to buy a wireless mouse',
  'Get me a mechanical keyboard',
  'I need a Bluetooth speaker',
  '2x USB-C cables please',
  'Buy me the 24-inch monitor',    // blocked by sku_allow_list
  'I want to buy the portable SSD', // blocked by max_order_amount
  'I want to buy a gaming laptop',  // not in catalog — shows the no-match path
];

const OUTCOME_STAMP = {
  success: 'stamp-pass',
  blocked: 'stamp-block',
  failed:  'stamp-retry',
};

const OUTCOME_LABEL = {
  success: 'Verdict · Pass',
  blocked: 'Verdict · Block',
  failed:  'Verdict · Retry',
};

const OUTCOME_BORDER = {
  success: 'border-pass/40 bg-pass-dim/40',
  blocked: 'border-block/40 bg-block-dim/40',
  failed:  'border-retry/40 bg-retry-dim/40',
  error:   'border-ink-line bg-ink-raised',
};

function storageKey(merchantId) {
  return `payguard-chat:${merchantId}`;
}

function loadPersisted(merchantId) {
  try {
    const raw = localStorage.getItem(storageKey(merchantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(merchantId, sessionId, messages) {
  try {
    localStorage.setItem(storageKey(merchantId), JSON.stringify({ sessionId, messages }));
  } catch {
    /* best-effort — a full localStorage or private browsing shouldn't break the demo */
  }
}

function MessageBubble({ msg, index }) {
  const isUser = msg.role === 'user';
  const outcome = msg.outcome;
  const outcomeColor = OUTCOME_BORDER[outcome] || OUTCOME_BORDER.error;
  const stampClass = OUTCOME_STAMP[outcome];

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-up`}
      style={{ animationDelay: `${Math.min(index, 6) * 30}ms` }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-agent-dim border border-agent/40 text-agent flex items-center justify-center text-xs font-mono font-semibold mr-2 shrink-0 mt-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-lg rounded-xl px-4 py-3 text-sm border ${
          isUser ? 'bg-signal/15 border-signal/40 text-text' : outcomeColor
        }`}
      >
        {isUser ? (
          <p>{msg.text}</p>
        ) : (
          <div className="space-y-1.5">
            <p className="font-medium text-text">{msg.text}</p>
            {stampClass && (
              <span className={stampClass}>{OUTCOME_LABEL[outcome]}</span>
            )}
            {msg.razorpayOrderId && (
              <p className="text-xs text-pass font-mono">
                Order ID: {msg.razorpayOrderId}
              </p>
            )}
            {msg.policyRule && (
              <p className="text-xs text-block">
                Rule: <span className="font-mono">{msg.policyRule}</span>
              </p>
            )}
            {msg.resolvedProduct && (
              <p className="text-xs text-text-muted">
                Matched: {msg.resolvedProduct.name} (₹{msg.resolvedProduct.price})
              </p>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-signal-dim border border-signal/40 text-signal-bright flex items-center justify-center text-xs font-mono font-semibold ml-2 shrink-0 mt-0.5">
          You
        </div>
      )}
    </div>
  );
}

export default function CheckoutDemo() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  const [sessionId, setSessionId] = useState(() => {
    const persisted = merchantId ? loadPersisted(merchantId) : null;
    return persisted?.sessionId || uuidv4();
  });
  const [messages, setMessages] = useState(() => {
    const persisted = merchantId ? loadPersisted(merchantId) : null;
    return persisted?.messages || [];
  });
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist every change — refreshing the page or coming back later keeps
  // the full conversation, and the session id stays stable so the policy
  // gate's per-session caps keep counting against the right session.
  useEffect(() => {
    if (!merchantId) return;
    savePersisted(merchantId, sessionId, messages);
  }, [merchantId, sessionId, messages]);

  const startNewSession = useCallback(() => {
    const fresh = uuidv4();
    setSessionId(fresh);
    setMessages([]);
    if (merchantId) savePersisted(merchantId, fresh, []);
  }, [merchantId]);

  async function submit(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const { data } = await sendCheckoutRequest({ intentText: trimmed, sessionId });

      // The server is the source of truth for sessionId — it may create one
      // on the very first message if none was sent yet.
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: data.message || data.error || 'Unexpected response.',
          outcome: data.outcome,
          razorpayOrderId: data.razorpayOrderId,
          policyRule: data.policyRule,
          resolvedProduct: data.resolvedProduct,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text: `Connection error: ${err.message}`, outcome: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-semibold text-text">Checkout demo</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-faint font-mono">session: {sessionId.slice(0, 8)}…</span>
          <button
            onClick={startNewSession}
            disabled={loading}
            className="text-xs text-text-muted hover:text-text border border-ink-line hover:border-ink-line2 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            New session
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={loading}
            className="text-xs bg-ink-raised hover:bg-ink-line hover:-translate-y-0.5 text-text-muted border border-ink-line px-3 py-1.5 rounded-full transition-all duration-200 disabled:opacity-40 disabled:translate-y-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto card p-4 space-y-1 mb-4">
        {messages.length === 0 && (
          <p className="text-text-faint text-sm text-center mt-8">
            Type a purchase request or click a suggestion above. Your conversation is saved automatically.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} index={i} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-agent-dim border border-agent/40 text-agent flex items-center justify-center text-xs font-mono font-semibold mr-2 shrink-0">
              AI
            </div>
            <div className="bg-ink-raised border border-ink-line rounded-xl px-4 py-3 text-sm text-text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-faint animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-text-faint animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-text-faint animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. I want to buy a wireless mouse"
          disabled={loading}
          className="input flex-1"
        />
        <button
          onClick={() => submit()}
          disabled={loading || !input.trim()}
          className="btn-primary disabled:opacity-40 disabled:active:scale-100"
        >
          Send
        </button>
      </div>
    </div>
  );
}
