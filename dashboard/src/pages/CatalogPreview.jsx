import React, { useEffect, useState } from 'react';
import { fetchCatalog } from '../api/coreApiClient.js';

function formatPrice(p) {
  return `₹${p.toLocaleString('en-IN')}`;
}

function StockPill({ stock }) {
  if (stock === 0) return <span className="badge-blocked">Out of stock</span>;
  if (stock <= 5)  return <span className="badge-failed">{stock} left</span>;
  return <span className="badge-success">{stock} in stock</span>;
}

export default function CatalogPreview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetchCatalog()
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const byCategory = products.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-text">Catalog</h1>
        <span className="text-sm text-text-faint font-mono">{products.length} active SKUs</span>
      </div>

      {error && (
        <div className="card border-block/40 bg-block-dim/20 text-block text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-text-faint">Loading catalog…</div>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-mono font-medium text-text-faint uppercase tracking-wide mb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((p) => (
                <div key={p.sku} className="card hover:border-ink-line2 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-text-faint">{p.sku}</span>
                    <StockPill stock={p.stock} />
                  </div>
                  <p className="text-sm font-medium text-text mb-1">{p.name}</p>
                  <p className="text-lg font-display font-semibold text-signal-bright">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
