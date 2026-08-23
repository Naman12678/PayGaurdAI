/**
 * coreApiClient.js
 *
 * THE ONLY way agent-service reaches money, the database, or Razorpay.
 * All calls go through HTTP to core-api.
 *
 * Two tokens flow out of this file:
 *   X-Service-Token  — INTERNAL_SERVICE_TOKEN env var, proves this is agent-service
 *   X-Merchant-Id    — the merchantId attached by the checkout flow
 *
 * What NEVER lives here: DATABASE_URL, RAZORPAY_KEY_*, JWT_SECRET.
 */

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:4000';

function serviceHeaders(requestId) {
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token) throw new Error('[coreApiClient] INTERNAL_SERVICE_TOKEN is not set.');
  return {
    'Content-Type':   'application/json',
    'X-Service-Token': token,
    ...(requestId ? { 'X-Request-Id': requestId } : {}),
  };
}

async function post(path, body, requestId) {
  const res  = await fetch(`${CORE_API_URL}${path}`, {
    method:  'POST',
    headers: serviceHeaders(requestId),
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok && res.status >= 500) {
    throw new Error(`[coreApiClient] ${path} returned ${res.status}: ${data.error || 'unknown error'}`);
  }
  return { status: res.status, data };
}

/**
 * Resolves a natural-language query to the best matching product.
 * merchantId is required so core-api scopes the lookup to the right catalog.
 */
export async function matchProduct(query, sessionId, merchantId) {
  const { data } = await post('/match', { query, sessionId, merchantId });
  return data;
}

/**
 * Checks a proposed order against the merchant's spend policy.
 */
export async function checkPolicy({ sku, amount, sessionId, quantity = 1, merchantId }) {
  const { data } = await post('/policy/check', { sku, amount, sessionId, quantity, merchantId });
  return data;
}

/**
 * Places a Razorpay order via core-api.
 * Only called after a confirmed 'pass' verdict.
 */
export async function placeOrder({ sku, quantity, amount, sessionId, requestId, intentText, merchantId, idempotencyKey }) {
  const { data } = await post(
    '/orders',
    { sku, quantity, amount, sessionId, intentText, merchantId, idempotencyKey },
    requestId
  );
  return data;
}
