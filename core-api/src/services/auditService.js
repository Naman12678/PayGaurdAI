const prisma = require('../config/db');

/**
 * Single write path for every audit_log row.
 * Every exit path MUST call this exactly once.
 * Supports an optional idempotencyKey for order dedup.
 *
 * @param {object} entry
 * @param {string}  entry.requestId
 * @param {string}  entry.merchantId
 * @param {string}  [entry.sessionId]
 * @param {string}  entry.intentText
 * @param {string}  [entry.matchedSku]
 * @param {string}  entry.policyVerdict
 * @param {string}  [entry.reason]
 * @param {string}  [entry.razorpayOrderId]
 * @param {string}  entry.outcome
 * @param {string}  [entry.idempotencyKey]
 */
async function writeAuditLog(entry) {
  const {
    requestId, merchantId, sessionId, intentText,
    matchedSku, policyVerdict, reason,
    razorpayOrderId, outcome, idempotencyKey,
  } = entry;

  return prisma.auditLog.create({
    data: {
      requestId,
      merchantId,
      sessionId:       sessionId      || null,
      intentText,
      matchedSku:      matchedSku     || null,
      policyVerdict,
      reason:          reason         || null,
      razorpayOrderId: razorpayOrderId || null,
      outcome,
      idempotencyKey:  idempotencyKey || null,
    },
  });
}

/**
 * Returns audit log entries for a merchant, most recent first.
 * Optionally filtered by sessionId.
 */
async function getAuditLog({ limit = 50, offset = 0, sessionId, merchantId, idempotencyKey } = {}) {
  const where = {
    merchantId,
    ...(sessionId       ? { sessionId }                                          : {}),
    ...(idempotencyKey  ? { idempotencyKey }                                     : {}),
  };
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take:    limit,
    skip:    offset,
    include: { product: { select: { name: true, price: true } } },
  });
}

module.exports = { writeAuditLog, getAuditLog };
