import React, { useEffect, useState, useCallback } from 'react';
import { fetchAuditLog } from '../api/coreApiClient.js';
import AuditRow from '../components/AuditRow.jsx';

const HEADERS = ['Time', 'Intent', 'SKU', 'Policy', 'Reason', 'Razorpay ID', 'Outcome', 'Req ID'];

export default function AuditTrail() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sessionFilter, setSessionFilter] = useState('');
  const [autoRefresh, setAutoRefresh]     = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchAuditLog({ sessionId: sessionFilter || undefined });
      setEntries(data.entries || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load, autoRefresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-text">Audit Trail</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by session ID…"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="input w-72 text-xs"
          />
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input
              type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-ink-line2 bg-ink-raised"
            />
            Auto-refresh
          </label>
          <button onClick={load} className="btn-primary text-sm py-1.5">Refresh</button>
        </div>
      </div>

      {error && (
        <div className="card border-block/40 bg-block-dim/20 text-block text-sm">{error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-line bg-ink-raised">
                {HEADERS.map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-mono font-medium text-text-faint uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={HEADERS.length} className="py-8 text-center text-text-faint">
                    Loading…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} className="py-8 text-center text-text-faint">
                    No audit records yet. Send a checkout request to get started.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => <AuditRow key={entry.id} entry={entry} />)
              )}
            </tbody>
          </table>
        </div>
        {entries.length > 0 && (
          <div className="border-t border-ink-line px-4 py-2 text-xs text-text-faint font-mono">
            Showing {entries.length} most recent entries
          </div>
        )}
      </div>
    </div>
  );
}
