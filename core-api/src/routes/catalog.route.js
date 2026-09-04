const express = require('express');
const { validate, restockSchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/requireAuth');
const { setStock } = require('../services/catalogService');

const router = express.Router();

/**
 * PUT /catalog/:sku
 * Merchant dashboard only (JWT auth) — sets a product's stock to an
 * absolute value. Scoped to the authenticated merchant's own catalog;
 * a SKU belonging to a different merchant returns 404, never a cross-tenant
 * leak or a silent no-op.
 */
router.put('/catalog/:sku', requireAuth, validate(restockSchema), async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { stock } = req.body;

    const updated = await setStock(sku, req.merchantId, stock);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found in your catalog.' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
