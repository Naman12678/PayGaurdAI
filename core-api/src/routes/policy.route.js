const express = require('express');
const { validate, policyCheckSchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/requireAuth');
const { requireServiceToken } = require('../middleware/requireServiceToken');
const { checkPolicy, getCurrentPolicy, updatePolicy } = require('../services/policyService');
const { ensureSession } = require('../services/sessionService');

const router = express.Router();

/**
 * POST /policy/check
 * Called only by agent-service (service token required).
 * Body must include merchantId so the policy is scoped correctly.
 */
router.post('/policy/check', requireServiceToken, validate(policyCheckSchema), async (req, res, next) => {
  try {
    const { sessionId, merchantId } = req.body;
    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required.' });
    }
    await ensureSession(sessionId, merchantId);
    const result = await checkPolicy({ ...req.body, merchantId });
    res.json(result);
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
 */
router.put('/policy', requireAuth, async (req, res, next) => {
  try {
    const { maxOrderAmount, allowedSkus, maxOrdersPerSession } = req.body;
    if (
      typeof maxOrderAmount      !== 'number' ||
      !Array.isArray(allowedSkus) ||
      typeof maxOrdersPerSession !== 'number'
    ) {
      const err = new Error('Invalid policy data.');
      err.status = 400;
      return next(err);
    }
    const updated = await updatePolicy({ maxOrderAmount, allowedSkus, maxOrdersPerSession }, req.merchantId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
