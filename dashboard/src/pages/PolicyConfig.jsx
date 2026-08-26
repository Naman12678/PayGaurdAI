import React, { useEffect, useState } from 'react';
import { fetchPolicy, fetchCatalog } from '../api/coreApiClient.js';
import PolicyForm from '../components/PolicyForm.jsx';

export default function PolicyConfig() {
  const [policy, setPolicy]   = useState(null);
  const [skus, setSkus]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  async function load() {
    try {
      const [p, catalog] = await Promise.all([fetchPolicy(), fetchCatalog()]);
      setPolicy(p);
      setSkus((catalog.products || []).map((p) => p.sku));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    load();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-display font-semibold text-text">Policy config</h1>
      <p className="text-sm text-text-muted">
        Spend limits and SKU allow-lists are enforced as deterministic code in core-api.
        Changes take effect on the next request.
      </p>

      {error && (
        <div className="card border-block/40 bg-block-dim/20 text-block text-sm">{error}</div>
      )}
      {saved && (
        <div className="card border-pass/40 bg-pass-dim/20 text-pass text-sm">
          Policy saved successfully.
        </div>
      )}

      {loading ? (
        <div className="text-text-faint">Loading policy…</div>
      ) : policy ? (
        <div className="card">
          <PolicyForm policy={policy} allSkus={skus} onSaved={handleSaved} />
        </div>
      ) : (
        <div className="text-text-faint">No policy configured.</div>
      )}
    </div>
  );
}
