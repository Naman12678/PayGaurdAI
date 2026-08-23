import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendCheckoutRequest } from '../api/agentApiClient.js';

const SUGGESTIONS = [
  'I want to buy a wireless mouse',
  'Get me a mechanical keyboard',
  'I need a Bluetooth speaker',
  '2x USB-C cables please',
  'Buy me the 24-inch monitor',    // blocked by sku_allow_list
  'I want to buy the portable SSD', // blocked by max_order_amount
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const outcome = msg.outcome;

  const outcomeColor = {
    success: 'border-green-700 bg-green-900/20',
    blocked: 'border-red-700 bg-red-900/20',
    failed:  'border-yellow-700 bg-yellow-900/20',
    error:   'border-gray-700 bg-gray-800',
  }[outcome] || 'border-gray-700 bg-gray-800';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-lg rounded-xl px-4 py-3 text-sm border ${
          isUser ? 'bg-razorpay-blue/20 border-razorpay-blue/40 text-white' : outcomeColor
        }`}
      >
        {isUser ? (
          <p>{msg.text}</p>
        ) : (
          <div className="space-y-1">
            <p className="font-medium text-white">{msg.text}</p>
            {msg.razorpayOrderId && (
              <p className="text-xs text-green-400 font-mono">
                Order ID: {msg.razorpayOrderId}
              </p>
            )}
            {msg.policyRule && (
              <p className="text-xs text-red-400">
                Rule: <span className="font-mono">{msg.policyRule}</span>
              </p>
            )}
            {msg.resolvedProduct && (
              <p className="text-xs text-gray-400">
                Matched: {msg.resolvedProduct.name} (₹{msg.resolvedProduct.price})
              </p>
            )}
            {msg.sessionId && (
              <p className="text-xs text-gray-600 font-mono">session: {msg.sessionId.slice(0, 8)}…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutDemo() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sessionId]             = useState(() => uuidv4());
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function submit(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const { status, data } = await sendCheckoutRequest({ intentText: trimmed, sessionId });

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: data.message || data.error || 'Unexpected response.',
          outcome: data.outcome,
          razorpayOrderId: data.razorpayOrderId,
          policyRule: data.policyRule,
          resolvedProduct: data.resolvedProduct,
          sessionId: data.sessionId,
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
        <h1 className="text-2xl font-bold">Checkout Demo</h1>
        <span className="text-xs text-gray-500 font-mono">session: {sessionId.slice(0, 8)}…</span>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={loading}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto card p-4 space-y-1 mb-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">
            Type a purchase request or click a suggestion above.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-400 animate-pulse">
              Agent is thinking…
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
          className="btn-primary disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
