const express = require('express');
const { validate, createOrderSchema } = require('../utils/validators');
const { requireServiceToken } = require('../middleware/requireServiceToken');
const { checkPolicy } = require('../services/policyService');
const { createOrder } = require('../services/razorpayService');
const { incrementOrderCount, ensureSession } = require('../services/sessionService');
const { writeAuditLog, getAuditLog } = require('../services/auditService');
const { getProductBySku } = require('../services/catalogService');

const router = express.Router();

/**
 * POST /orders
 * Called ONLY by agent-service (service token required).
 * Body must include merchantId for scoping.
 *
 * Idempotency: if the same idempotencyKey has already produced a successful
 * audit_log row, return the cached outcome without re-calling Razorpay.
 *
 * Flow:
 *  1. Idempotency check
 *  2. Defense-in-depth policy re-check
 *  3. Stock check
 *  4. Razorpay order creation (single retry baked in)
 *  5. Session counter increment (on success only)
 *  6. Exactly one audit_log row written
 */
router.post('/orders', requireServiceToken, validate(createOrderSchema), async (req, res, next) => {
  const { sku, quantity, amount, sessionId, intentText, merchantId, idempotencyKey } = req.body;
  // Always use the server-generated requestId — never trust the client's
  const requestId = req.requestId;

  if (!merchantId) {
    return res.status(400).json({ error: 'merchantId is required.' });
  }

  try {
    // ── 1. Idempotency check ─────────────────────────────────────────────────
    if (idempotencyKey) {
      const existing = await getAuditLog({
        limit: 1, merchantId,
        idempotencyKey,
      });
      if (existing.length > 0 && existing[0].outcome === 'success') {
        return res.json({
          outcome:        'success',
          razorpayOrderId: existing[0].razorpayOrderId,
          idempotent:      true,
        });
      }
    }

    // ── 2. Ensure session exists ─────────────────────────────────────────────
    await ensureSession(sessionId, merchantId);

    // ── 3. Defense-in-depth policy re-check ─────────────────────────────────
    const policyResult = await checkPolicy({ sku, amount, sessionId, quantity, merchantId });
    if (policyResult.verdict === 'block') {
      await writeAuditLog({
        requestId, merchantId, sessionId, intentText,
        matchedSku: sku, policyVerdict: 'block',
        reason: policyResult.reason, outcome: 'blocked',
        idempotencyKey: idempotencyKey || null,
      });
      return res.status(403).json({
        outcome: 'blocked', rule: policyResult.rule, reason: policyResult.reason,
      });
    }

    // ── 4. Stock check ───────────────────────────────────────────────────────
    const product = await getProductBySku(sku, merchantId);
    if (!product || product.stock < quantity) {
      await writeAuditLog({
        requestId, merchantId, sessionId, intentText,
        matchedSku: sku, policyVerdict: 'pass',
        reason: 'Product unavailable or insufficient stock at order time.',
        outcome: 'failed', idempotencyKey: idempotencyKey || null,
      });
      return res.status(409).json({ outcome: 'failed', reason: 'Product unavailable or insufficient stock.' });
    }

    // ── 5. Call Razorpay (single retry inside razorpayService) ───────────────
    const amountPaise = amount * quantity * 100;
    const razorpayResult = await createOrder({
      amount:  amountPaise,
      receipt: `rcpt_${requestId.replace(/-/g, '').slice(0, 20)}`,
      notes:   { sku, quantity: String(quantity), sessionId, merchantId },
    });

    // ── 6. Increment session counter on success only ─────────────────────────
    if (razorpayResult.outcome === 'success') {
      await incrementOrderCount(sessionId, merchantId);
    }

    // ── 7. Write exactly one audit row ───────────────────────────────────────
    await writeAuditLog({
      requestId, merchantId, sessionId, intentText,
      matchedSku:      sku,
      policyVerdict:   'pass',
      reason:          razorpayResult.reason          || null,
      razorpayOrderId: razorpayResult.razorpayOrderId || null,
      outcome:         razorpayResult.outcome,
      idempotencyKey:  idempotencyKey || null,
    });

    res.json({
      outcome:         razorpayResult.outcome,
      razorpayOrderId: razorpayResult.razorpayOrderId,
      reason:          razorpayResult.reason,
    });
  } catch (err) {
    try {
      await writeAuditLog({
        requestId, merchantId, sessionId, intentText,
        matchedSku: sku, policyVerdict: 'unknown',
        reason: 'Unexpected server error', outcome: 'failed',
        idempotencyKey: idempotencyKey || null,
      });
    } catch (_) { /* swallow audit write failure */ }
    next(err);
  }
});

module.exports = router;
