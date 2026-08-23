const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getAllActiveProducts } = require('../services/catalogService');

const router = express.Router();

/**
 * GET /.well-known/agent-catalog.json
 * Returns this merchant's active catalog.
 * Protected: requires merchant JWT.
 */
router.get('/.well-known/agent-catalog.json', requireAuth, async (req, res, next) => {
  try {
    const products = await getAllActiveProducts(req.merchantId);
    res.json({ merchant: req.merchantId, currency: 'INR', products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
