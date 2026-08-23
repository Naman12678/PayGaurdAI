/**
 * Dashboard → agent-service HTTP client.
 * Sends natural-language checkout requests.
 * merchantId is read from sessionStorage so agent-service can scope catalog/policy.
 */

const BASE = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:4100';

export async function sendCheckoutRequest({ intentText, sessionId }) {
  const merchant = JSON.parse(sessionStorage.getItem('merchant') || 'null');
  const merchantId = merchant?.id;

  if (!merchantId) throw new Error('Not authenticated. Please log in.');

  const res = await fetch(`${BASE}/checkout`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ intentText, sessionId, merchantId }),
  });

  const data = await res.json();
  return { status: res.status, data };
}
