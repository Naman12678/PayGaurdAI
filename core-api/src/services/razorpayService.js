const Razorpay = require('razorpay');
const env = require('../config/env');

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpaySecret,
});

/**
 * The Razorpay Node SDK doesn't always throw a plain Error — auth/validation
 * failures come back shaped like { statusCode, error: { code, description } },
 * where `.message` is often undefined or unhelpfully generic. This extracts
 * whatever's actually useful so server logs show the real reason instead of
 * "undefined", which is otherwise the single biggest reason this looks like
 * "nothing is happening" when it's actually failing loudly.
 */
function describeRazorpayError(err) {
  const description = err?.error?.description || err?.description;
  const code         = err?.error?.code || err?.code;
  const statusCode   = err?.statusCode;
  if (description) {
    return `${statusCode ? `HTTP ${statusCode} ` : ''}${code ? `[${code}] ` : ''}${description}`;
  }
  return err?.message || JSON.stringify(err);
}

/**
 * Creates a Razorpay order.
 * Retries exactly once on any error, then returns a structured outcome.
 * agent-service never sees a raw Razorpay error.
 *
 * @param {object} params
 * @param {number} params.amount  - amount in paise (rupees × 100)
 * @param {string} params.receipt - unique receipt identifier
 * @param {object} [params.notes] - optional metadata
 *
 * @returns {Promise<{ outcome: 'success'|'failed', razorpayOrderId?: string, reason?: string }>}
 */
async function createOrder({ amount, receipt, notes = {} }) {
  const payload = {
    amount,          // Razorpay expects paise
    currency: 'INR',
    receipt,
    notes,
  };

  // Attempt 1
  try {
    const order = await razorpay.orders.create(payload);
    console.log(`[razorpay] Order created: ${order.id} (₹${amount / 100})`);
    return { outcome: 'success', razorpayOrderId: order.id };
  } catch (firstError) {
    console.error(`[razorpay] First attempt failed: ${describeRazorpayError(firstError)}. Retrying once...`);
  }

  // Attempt 2 (single retry)
  try {
    const order = await razorpay.orders.create(payload);
    console.log(`[razorpay] Order created on retry: ${order.id} (₹${amount / 100})`);
    return { outcome: 'success', razorpayOrderId: order.id };
  } catch (secondError) {
    console.error(`[razorpay] Retry also failed: ${describeRazorpayError(secondError)}`);
    return {
      outcome: 'failed',
      reason: 'Payment gateway unavailable after retry. Please try again later.',
    };
  }
}

module.exports = { createOrder };
