/**
 * tavilyClient.js
 *
 * Optional, informational-only web search used when a buyer's request
 * doesn't match anything in the merchant's own catalog. This NEVER produces
 * anything orderable — it only enriches the "no such product" response with
 * "here's what that usually looks like elsewhere" context, so the agent can
 * be helpful without being able to check out against a product that never
 * passed through the catalog, the policy gate, or the merchant's own
 * allow-list. Purely additive to the existing no_match path; it never
 * changes the graph's outcome or opens any path to /orders.
 *
 * Entirely optional: if TAVILY_API_KEY isn't set, callers should skip this
 * and fall back to the plain no_match message — the app must work exactly
 * as before with zero configuration for this feature.
 */

const TAVILY_URL = 'https://api.tavily.com/search';
const TIMEOUT_MS = 6000;

/**
 * @param {string} query - the buyer's (already-parsed) product query
 * @returns {Promise<{ answer: string|null, results: Array<{title, url}> }|null>}
 *          null on any failure — search is best-effort and must never break
 *          the checkout flow.
 */
export async function searchSimilarProducts(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        query: `${query} product buy online`,
        search_depth: 'basic',
        max_results: 4,
        include_answer: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[tavily] Search failed: HTTP ${res.status} — ${body.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    const results = (data.results || [])
      .slice(0, 4)
      .map((r) => ({ title: r.title, url: r.url }))
      .filter((r) => r.title && r.url);

    if (results.length === 0 && !data.answer) return null;

    return { answer: data.answer || null, results };
  } catch (err) {
    console.warn(`[tavily] Search error: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
