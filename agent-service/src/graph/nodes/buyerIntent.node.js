/**
 * buyerIntent.node.js
 *
 * Entry node. Receives raw input and seeds the graph state.
 * No LLM call here - this is pure data normalisation.
 */

export async function buyerIntentNode(state) {
  const { intentText, sessionId, requestId } = state;

  if (!intentText || intentText.trim().length === 0) {
    return {
      ...state,
      error: 'Intent text is required.',
      stage: 'error',
    };
  }

  return {
    ...state,
    intentText: intentText.trim(),
    sessionId,
    requestId,
    stage: 'resolve_intent',
  };
}
