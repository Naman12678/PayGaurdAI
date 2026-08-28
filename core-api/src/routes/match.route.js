const express = require('express');
const { validate, matchSchema } = require('../utils/validators');
const { requireServiceToken } = require('../middleware/requireServiceToken');
const { internalLimiter } = require('../middleware/rateLimiters');
const { findBestMatch } = require('../services/catalogService');
const { writeAuditLog } = require('../services/auditService');

const router = express.Router();

/**
 * POST /match
 * Called only by agent-service (service token required).
 * Body: { query: string, sessionId?: UUID, merchantId: UUID, intentText?: string }
 *
 * A no-match is a terminal outcome for the request — the graph ends here and
 * checkoutAgent (the only other node that touches core-api) never runs — so
 * this is the only place that outcome can ever be logged. Matches don't get
 * their own row here; the eventual /orders (or /policy/check block) call
 * writes the definitive one for a request that got that far.
 */
router.post('/match', requireServiceToken, internalLimiter, validate(matchSchema), async (req, res, next) => {
  try {
    const { query, merchantId, sessionId, intentText } = req.body;
    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required.' });
    }
    const product = await findBestMatch(query, merchantId);
    if (!product) {
      const reason = `No active product matched the query: "${query}"`;

      await writeAuditLog({
        requestId:     req.requestId,
        merchantId,
        sessionId:     sessionId || null,
        intentText:    intentText || query,
        matchedSku:    null,
        policyVerdict: 'n/a',
        reason,
        outcome:       'no_match',
      });

      return res.status(404).json({ outcome: 'no_match', reason });
    }
    res.json({ outcome: 'matched', product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
