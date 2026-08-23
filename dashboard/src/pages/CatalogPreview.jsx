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
        <h1 className="text-2xl font-bold">Catalog Preview</h1>
        <span className="text-sm text-gray-500">{products.length} active SKUs</span>
      </div>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading catalog…</div>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((p) => (
                <div key={p.sku} className="card hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-gray-500">{p.sku}</span>
                    <StockPill stock={p.stock} />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{p.name}</p>
                  <p className="text-lg font-bold text-razorpay-blue">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
