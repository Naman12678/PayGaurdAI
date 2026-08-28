import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createGroqClient }                   from '../../llm/groqClient.js';
import { createFallbackClient, withFallback } from '../../llm/fallbackClient.js';
import { matchProduct, logAudit }             from '../../tools/coreApiClient.js';
import { INTENT_RESOLVER_SYSTEM }             from '../../llm/promptTemplates.js';

export async function intentResolverNode(state) {
  const { intentText, sessionId, merchantId, requestId } = state;

  // ── Step 1: LLM extracts a structured query ────────────────────────────────
  let parsedIntent;
  try {
    const groq     = createGroqClient();
    const fallback = createFallbackClient();

    const rawResponse = await withFallback(
      () => groq.invoke([
        new SystemMessage(INTENT_RESOLVER_SYSTEM),
        new HumanMessage(intentText),
      ]),
      () => fallback.invoke([
        new SystemMessage(INTENT_RESOLVER_SYSTEM),
        new HumanMessage(intentText),
      ])
    );

    // Strip any accidental markdown fences, then parse JSON
    const text = rawResponse.content
      .replace(/```json\n?|```/g, '')
      .trim();
    parsedIntent = JSON.parse(text);
  } catch (err) {
    const reason = `Intent parsing failed: ${err.message}`;
    await logAudit({ sessionId, merchantId, intentText, outcome: 'no_match', reason }, requestId);
    return { ...state, error: reason, stage: 'error' };
  }

  const { query, quantity = 1, confidence = 1 } = parsedIntent;

  if (confidence < 0.4) {
    const reason = `Could not understand the purchase request (confidence: ${confidence}). Please be more specific.`;
    // This request never reaches /match or /policy/check, so it would
    // otherwise leave no audit trail entry at all — log it directly.
    await logAudit({ sessionId, merchantId, intentText, outcome: 'no_match', reason }, requestId);
    return {
      ...state,
      error:        reason,
      stage:        'error',
      matchOutcome: 'no_match',
    };
  }

  // ── Step 2: Resolve query against catalog via core-api /match ──────────────
  let matchResult;
  try {
    matchResult = await matchProduct(query, sessionId, merchantId, intentText);
  } catch (err) {
    const reason = `Catalog lookup failed: ${err.message}`;
    await logAudit({ sessionId, merchantId, intentText, outcome: 'failed', reason }, requestId);
    return { ...state, error: reason, stage: 'error' };
  }

  if (matchResult.outcome === 'no_match') {
    // /match already wrote the audit row for this outcome.
    return {
      ...state,
      error:        matchResult.reason || `No product matched: "${query}"`,
      stage:        'error',
      matchOutcome: 'no_match',
    };
  }

  return {
    ...state,
    resolvedProduct: matchResult.product,
    quantity,
    stage: 'checkout',
  };
}
