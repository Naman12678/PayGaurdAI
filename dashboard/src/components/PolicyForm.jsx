import React, { useState } from 'react';
import { updatePolicy } from '../api/coreApiClient.js';

export default function PolicyForm({ policy, allSkus, onSaved }) {
  const [maxAmount, setMaxAmount]             = useState(policy.maxOrderAmount);
  const [maxSessionSpend, setMaxSessionSpend] = useState(policy.maxSessionSpend);
  const [maxPerSession, setMaxPerSession]     = useState(policy.maxOrdersPerSession);
  const [allowedSkus, setAllowedSkus]         = useState(new Set(policy.allowedSkus));
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState(null);

  function toggleSku(sku) {
    setAllowedSkus((prev) => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updatePolicy({
        maxOrderAmount: Number(maxAmount),
        maxSessionSpend: Number(maxSessionSpend),
        maxOrdersPerSession: Number(maxPerSession),
        allowedSkus: Array.from(allowedSkus),
      });
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-text-muted mb-1">Max order amount (₹)</label>
          <input
            type="number" min="1" value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Max session spend (₹)</label>
          <input
            type="number" min="1" value={maxSessionSpend}
            onChange={(e) => setMaxSessionSpend(e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-text-faint mt-1">Total across every order in one session — the aggregate cap.</p>
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Max orders per session</label>
          <input
            type="number" min="1" value={maxPerSession}
            onChange={(e) => setMaxPerSession(e.target.value)}
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-text-muted mb-2">Allowed SKUs</label>
        <div className="grid grid-cols-3 gap-2">
          {allSkus.map((sku) => (
            <label key={sku} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allowedSkus.has(sku)}
                onChange={() => toggleSku(sku)}
                className="rounded border-ink-line2 bg-ink-raised"
              />
              <span className="font-mono text-text">{sku}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-block text-sm">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? 'Saving…' : 'Save policy'}
      </button>
    </form>
  );
}
