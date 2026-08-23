const express = require('express');
const { validate, matchSchema } = require('../utils/validators');
const { requireServiceToken } = require('../middleware/requireServiceToken');
const { findBestMatch } = require('../services/catalogService');

const router = express.Router();

/**
 * POST /match
 * Called only by agent-service (service token required).
 * Body: { query: string, sessionId?: UUID, merchantId: UUID }
 */
router.post('/match', requireServiceToken, validate(matchSchema), async (req, res, next) => {
  try {
    const { query, merchantId } = req.body;
    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required.' });
    }
    const product = await findBestMatch(query, merchantId);
    if (!product) {
      return res.status(404).json({
        outcome: 'no_match',
        reason:  `No active product matched the query: "${query}"`,
      });
    }
    res.json({ outcome: 'matched', product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
