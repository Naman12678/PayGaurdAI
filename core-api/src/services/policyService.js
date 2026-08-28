const prisma = require('../config/db');

/**
 * Pure policy evaluation function, scoped to a merchant.
 * Returns a structured verdict — never a bare boolean.
 *
 * @param {object} order
 * @param {string} order.sku
 * @param {number} order.amount      - per-unit price in rupees
 * @param {string} order.sessionId   - UUID
 * @param {number} [order.quantity]  - defaults to 1
 * @param {string} order.merchantId  - authenticated merchant
 *
 * @returns {Promise<{ verdict: 'pass'|'block', rule: string|null, reason: string|null }>}
 */
async function checkPolicy(order) {
  const { sku, amount, sessionId, quantity = 1, merchantId } = order;

  const policy = await prisma.policy.findFirst({
    where: { merchantId },
    orderBy: { id: 'desc' },
  });
  if (!policy) {
    return { verdict: 'block', rule: 'no_policy', reason: 'No active policy found. Failing closed.' };
  }

  // Rule 1: SKU allow list
  if (!policy.allowedSkus.includes(sku)) {
    return { verdict: 'block', rule: 'sku_allow_list', reason: `SKU ${sku} is not on the allowed SKU list.` };
  }

  // Rule 2: Max order amount
  const totalAmount = amount * quantity;
  if (totalAmount > policy.maxOrderAmount) {
    return {
      verdict: 'block', rule: 'max_order_amount',
      reason: `Order amount ${totalAmount} exceeds cap of ${policy.maxOrderAmount}.`,
    };
  }

  // Rule 3: Max orders per session (scoped to this merchant's session)
  const session = await prisma.session.findFirst({
    where: { sessionId, merchantId },
  });
  const ordersPlaced = session ? session.ordersPlaced : 0;
  if (ordersPlaced >= policy.maxOrdersPerSession) {
    return {
      verdict: 'block', rule: 'max_orders_per_session',
      reason: `Session has already placed ${ordersPlaced} order(s); limit is ${policy.maxOrdersPerSession}.`,
    };
  }

  // Rule 4: Max cumulative spend per session — this is the aggregate
  // backstop the per-order cap can't provide on its own. Without it, a
  // session could place maxOrdersPerSession orders each just under
  // maxOrderAmount with no ceiling on their sum.
  const spentSoFar = session ? session.totalSpent : 0;
  const projectedSpend = spentSoFar + totalAmount;
  if (projectedSpend > policy.maxSessionSpend) {
    return {
      verdict: 'block', rule: 'max_session_spend',
      reason: `This order would bring session spend to ${projectedSpend}, exceeding the session cap of ${policy.maxSessionSpend}.`,
    };
  }

  return { verdict: 'pass', rule: null, reason: null };
}

/**
 * Returns the current active policy for a merchant.
 */
async function getCurrentPolicy(merchantId) {
  return prisma.policy.findFirst({ where: { merchantId }, orderBy: { id: 'desc' } });
}

/**
 * Updates the merchant's policy (creates one if none exists).
 */
async function updatePolicy(data, merchantId) {
  const existing = await prisma.policy.findFirst({ where: { merchantId }, orderBy: { id: 'desc' } });
  if (existing) {
    return prisma.policy.update({
      where: { id: existing.id },
      data: {
        maxOrderAmount:      data.maxOrderAmount,
        maxSessionSpend:     data.maxSessionSpend,
        allowedSkus:         data.allowedSkus,
        maxOrdersPerSession: data.maxOrdersPerSession,
      },
    });
  }
  return prisma.policy.create({ data: { ...data, merchantId } });
}

module.exports = { checkPolicy, getCurrentPolicy, updatePolicy };
