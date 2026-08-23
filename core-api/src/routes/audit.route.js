const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getAuditLog } = require('../services/auditService');

const router = express.Router();

/**
 * GET /audit
 * Read-only, scoped to the authenticated merchant.
 * Query params: limit (max 200), offset, sessionId
 */
router.get('/audit', requireAuth, async (req, res, next) => {
  try {
    const limit     = Math.min(parseInt(req.query.limit  || '50', 10), 200);
    const offset    = parseInt(req.query.offset || '0', 10);
    const { sessionId } = req.query;

    const entries = await getAuditLog({ limit, offset, sessionId, merchantId: req.merchantId });
    res.json({ entries, limit, offset });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
