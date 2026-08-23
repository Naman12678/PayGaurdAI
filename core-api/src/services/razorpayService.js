const Razorpay = require('razorpay');
const env = require('../config/env');

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpaySecret,
});

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
    return { outcome: 'success', razorpayOrderId: order.id };
  } catch (firstError) {
    console.error(`[razorpay] First attempt failed: ${firstError.message}. Retrying once...`);
  }

  // Attempt 2 (single retry)
  try {
    const order = await razorpay.orders.create(payload);
    return { outcome: 'success', razorpayOrderId: order.id };
  } catch (secondError) {
    console.error(`[razorpay] Retry also failed: ${secondError.message}`);
    return {
      outcome: 'failed',
      reason: 'Payment gateway unavailable after retry. Please try again later.',
    };
  }
}

module.exports = { createOrder };
