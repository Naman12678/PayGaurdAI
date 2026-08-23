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
      <h1 className="text-2xl font-bold">Policy Configuration</h1>
      <p className="text-sm text-gray-400">
        Spend limits and SKU allow-lists are enforced as deterministic code in core-api.
        Changes take effect on the next request.
      </p>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm">{error}</div>
      )}
      {saved && (
        <div className="card border-green-800 bg-green-900/20 text-green-300 text-sm">
          Policy saved successfully.
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading policy…</div>
      ) : policy ? (
        <div className="card">
          <PolicyForm policy={policy} allSkus={skus} onSaved={handleSaved} />
        </div>
      ) : (
        <div className="text-gray-500">No policy configured.</div>
      )}
    </div>
  );
}
