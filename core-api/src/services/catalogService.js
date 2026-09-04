const prisma = require('../config/db');

/**
 * Returns all active products owned by the given merchant.
 */
async function getAllActiveProducts(merchantId) {
  return prisma.product.findMany({
    where: { active: true, merchantId },
    orderBy: { sku: 'asc' },
  });
}

// A match needs at least this much signal to count. Below this, treat it
// as no match rather than guessing — a weak partial match is worse than an
// honest "we don't carry that," since it can silently substitute the wrong
// product for what the buyer actually asked for.
const MINIMUM_SCORE = 30;

/**
 * Finds the single best product match for a plain-text search query,
 * scoped to the authenticated merchant's catalog.
 * Only considers active products with stock > 0.
 * Returns null when nothing matches with enough confidence.
 */
async function findBestMatch(query, merchantId) {
  const q = query.toLowerCase().trim();
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 2);

  const products = await prisma.product.findMany({
    where: { active: true, stock: { gt: 0 }, merchantId },
  });

  const scored = products
    .map((p) => {
      const name     = p.name.toLowerCase();
      const sku      = p.sku.toLowerCase();
      const category = p.category.toLowerCase();

      let score = 0;
      if      (sku === q)          score = 100;
      else if (name === q)         score = 80;
      else if (name.includes(q))   score = 50;
      else if (sku.includes(q))    score = 40;
      else if (category === q)     score = 25;

      // Word-overlap fallback — only when none of the above (stronger,
      // unambiguous) signals fired. Requires a clear majority of the
      // query's words to actually appear in the product name — a single
      // incidental word match (e.g. "laptop" inside "Laptop Backpack" when
      // the buyer asked for a "gaming laptop") is exactly the false-positive
      // this guards against; one shared word out of two is not confidence,
      // it's coincidence.
      if (score === 0 && queryWords.length > 0) {
        const nameMatches = queryWords.filter((w) => name.includes(w)).length;
        const matchRatio  = nameMatches / queryWords.length;
        if (matchRatio >= 0.6) {
          score = Math.round(30 * matchRatio);
        }
      }

      return { product: p, score };
    })
    .filter((s) => s.score >= MINIMUM_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  return scored[0].product;
}

/**
 * Looks up a product by exact SKU, scoped to the authenticated merchant.
 * Returns null if not found, inactive, or owned by a different merchant.
 */
async function getProductBySku(sku, merchantId) {
  return prisma.product.findFirst({
    where: { sku, active: true, merchantId },
  });
}

/**
 * Atomically decrements stock for a successful order. Guarded by a
 * `stock >= quantity` WHERE clause so two concurrent orders can never push
 * stock negative — if the guard fails to match a row, `count` is 0 and the
 * caller knows the decrement didn't happen (someone else took the last unit
 * between the pre-charge stock check and this call).
 */
async function decrementStock(sku, quantity, merchantId) {
  const result = await prisma.product.updateMany({
    where: { sku, merchantId, stock: { gte: quantity } },
    data:  { stock: { decrement: quantity } },
  });
  return result.count > 0;
}

/**
 * Sets stock for a product to an absolute value (not a delta), scoped to
 * the owning merchant. Used by the merchant dashboard's restock UI.
 * Returns the updated product, or null if no matching row was found
 * (wrong SKU, wrong merchant, or product doesn't exist).
 */
async function setStock(sku, merchantId, stock) {
  const result = await prisma.product.updateMany({
    where: { sku, merchantId },
    data:  { stock },
  });
  if (result.count === 0) return null;
  return prisma.product.findFirst({ where: { sku, merchantId } });
}

module.exports = { getAllActiveProducts, findBestMatch, getProductBySku, decrementStock, setStock };
