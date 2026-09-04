const express = require('express');
const { validate, policyCheckSchema, auditLogSchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { requireServiceToken } = require('../middleware/requireServiceToken');
const { internalLimiter } = require('../middleware/rateLimiters');
const { checkPolicy, getCurrentPolicy, updatePolicy } = require('../services/policyService');
const { ensureSession } = require('../services/sessionService');
const { writeAuditLog } = require('../services/auditService');

const router = express.Router();

/**
 * POST /policy/check
 * Called only by agent-service (service token required).
 * Body must include merchantId so the policy is scoped correctly.
 *
 * A 'block' verdict here is a terminal outcome — checkoutAgent stops and
 * never calls /orders — so this is the only place that outcome can be
 * logged. A 'pass' verdict does NOT get logged here; /orders writes the
 * definitive row once the order actually resolves.
 */
router.post('/policy/check', requireServiceToken, internalLimiter, validate(policyCheckSchema), async (req, res, next) => {
  try {
    const { sessionId, merchantId, sku, intentText } = req.body;
    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required.' });
    }
    await ensureSession(sessionId, merchantId);
    const result = await checkPolicy({ ...req.body, merchantId });

    if (result.verdict === 'block') {
      await writeAuditLog({
        requestId:     req.requestId,
        merchantId,
        sessionId:     sessionId || null,
        intentText:    intentText || `Policy check for ${sku}`,
        matchedSku:    sku,
        policyVerdict: 'block',
        reason:        result.reason,
        outcome:       'blocked',
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /audit/log
 * Called only by agent-service (service token required) — the one escape
 * hatch for a request that terminates before it ever reaches /match or
 * /policy/check (e.g. the LLM couldn't parse the intent at all), so it would
 * otherwise never produce an audit row.
 */
router.post('/audit/log', requireServiceToken, internalLimiter, validate(auditLogSchema), async (req, res, next) => {
  try {
    const { sessionId, merchantId, intentText, outcome, reason } = req.body;
    const entry = await writeAuditLog({
      requestId:     req.requestId,
      merchantId,
      sessionId:     sessionId || null,
      intentText,
      matchedSku:    null,
      policyVerdict: 'n/a',
      reason:        reason || null,
      outcome,
    });
    res.status(201).json({ id: entry.id });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /policy  — merchant dashboard read
 */
router.get('/policy', requireAuth, async (req, res, next) => {
  try {
    const policy = await getCurrentPolicy(req.merchantId);
    if (!policy) return res.status(404).json({ error: 'No policy configured.' });
    res.json(policy);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /policy  — merchant dashboard update
 * Admin-only: policy changes set the actual spend boundaries an agent can
 * transact within, so this requires the admin role, not just any
 * authenticated session on the account.
 */
router.put('/policy', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { maxOrderAmount, maxSessionSpend, allowedSkus, maxOrdersPerSession } = req.body;
    if (
      typeof maxOrderAmount      !== 'number' ||
      typeof maxSessionSpend     !== 'number' ||
      !Array.isArray(allowedSkus) ||
      typeof maxOrdersPerSession !== 'number'
    ) {
      const err = new Error('Invalid policy data.');
      err.status = 400;
      return next(err);
    }
    if (maxSessionSpend < maxOrderAmount) {
      const err = new Error('Session spend cap cannot be lower than the per-order cap.');
      err.status = 400;
      return next(err);
    }
    const updated = await updatePolicy({ maxOrderAmount, maxSessionSpend, allowedSkus, maxOrdersPerSession }, req.merchantId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
