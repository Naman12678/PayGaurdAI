import { checkPolicy, placeOrder } from '../../tools/coreApiClient.js';
import { v4 as uuidv4 }            from 'uuid';

export async function checkoutAgentNode(state) {
  const { resolvedProduct, quantity = 1, sessionId, requestId, intentText, merchantId } = state;

  if (!resolvedProduct) {
    return { ...state, error: 'No resolved product available for checkout.', stage: 'error' };
  }

  const { sku, price, name } = resolvedProduct;
  const amount = price; // per-unit price in rupees

  // ── Policy check (deterministic — no LLM) ─────────────────────────────────
  let policyResult;
  try {
    policyResult = await checkPolicy({ sku, amount, sessionId, quantity, merchantId });
  } catch (err) {
    return { ...state, error: `Policy check failed: ${err.message}`, stage: 'error' };
  }

  if (policyResult.verdict === 'block') {
    return {
      ...state,
      policyVerdict: 'block',
      policyRule:    policyResult.rule,
      policyReason:  policyResult.reason,
      stage:         'done',
      outcome:       'blocked',
      message:       `Order blocked by policy: ${policyResult.reason}`,
    };
  }

  // ── Place order via core-api (pass verdict confirmed) ─────────────────────
  // idempotencyKey = requestId so retries from the same checkout call are idempotent
  const idempotencyKey = requestId || uuidv4();

  let orderResult;
  try {
    orderResult = await placeOrder({
      sku, quantity, amount, sessionId,
      requestId, intentText, merchantId,
      idempotencyKey,
    });
  } catch (err) {
    return {
      ...state,
      policyVerdict: 'pass',
      error:         `Order placement failed: ${err.message}`,
      stage:         'error',
      outcome:       'failed',
    };
  }

  if (orderResult.outcome === 'success') {
    return {
      ...state,
      policyVerdict:   'pass',
      outcome:         'success',
      razorpayOrderId: orderResult.razorpayOrderId,
      stage:           'done',
      message:         `Order placed for ${name} (qty: ${quantity}). Razorpay order ID: ${orderResult.razorpayOrderId}`,
    };
  }

  return {
    ...state,
    policyVerdict: 'pass',
    outcome:       'failed',
    stage:         'done',
    message:       `Order failed: ${orderResult.reason || 'Payment gateway error'}`,
  };
}
