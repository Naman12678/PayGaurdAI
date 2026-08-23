const prisma = require('../config/db');

/**
 * Atomically increments orders_placed for a session owned by a merchant.
 * Uses a row-level lock so concurrent requests cannot double-count.
 */
async function incrementOrderCount(sessionId, merchantId) {
  return prisma.$transaction(async (tx) => {
    await tx.session.upsert({
      where:  { sessionId },
      create: { sessionId, ordersPlaced: 0, merchantId },
      update: {},
    });

    const updated = await tx.$queryRaw`
      UPDATE sessions
      SET    orders_placed = orders_placed + 1
      WHERE  session_id  = ${sessionId}::uuid
        AND  merchant_id = ${merchantId}::uuid
      RETURNING session_id, orders_placed
    `;

    if (!updated.length) throw new Error('Session not found during increment.');

    return {
      sessionId:    updated[0].session_id,
      ordersPlaced: updated[0].orders_placed,
    };
  });
}

/**
 * Ensures a session row exists for a given merchant without incrementing the counter.
 * Called before policy check so policy can read orders_placed.
 */
async function ensureSession(sessionId, merchantId) {
  return prisma.session.upsert({
    where:  { sessionId },
    create: { sessionId, ordersPlaced: 0, merchantId },
    update: {},
  });
}

module.exports = { incrementOrderCount, ensureSession };
