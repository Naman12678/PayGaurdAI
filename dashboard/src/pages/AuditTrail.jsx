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
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by session ID…"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="input w-72 text-xs"
          />
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800"
            />
            Auto-refresh
          </label>
          <button onClick={load} className="btn-primary text-sm py-1.5">Refresh</button>
        </div>
      </div>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm">{error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                {HEADERS.map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={HEADERS.length} className="py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} className="py-8 text-center text-gray-500">
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
          <div className="border-t border-gray-800 px-4 py-2 text-xs text-gray-500">
            Showing {entries.length} most recent entries
          </div>
        )}
      </div>
    </div>
  );
}
