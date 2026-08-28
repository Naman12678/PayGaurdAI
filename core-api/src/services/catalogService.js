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

/**
 * Finds the single best product match for a plain-text search query,
 * scoped to the authenticated merchant's catalog.
 * Only considers active products with stock > 0.
 * Returns null when nothing matches.
 */
async function findBestMatch(query, merchantId) {
  const q = query.toLowerCase().trim();

  const products = await prisma.product.findMany({
    where: { active: true, stock: { gt: 0 }, merchantId },
  });

  const inStock = products.filter((p) => p.stock > 0);

  const scored = inStock
    .map((p) => {
      let score = 0;
      if (p.sku.toLowerCase() === q)            score += 100;
      if (p.name.toLowerCase() === q)           score += 80;
      if (p.name.toLowerCase().includes(q))     score += 50;
      if (p.sku.toLowerCase().includes(q))      score += 40;
      if (p.category.toLowerCase().includes(q)) score += 20;
      const words = q.split(/\s+/);
      for (const word of words) {
        if (word.length < 2) continue;
        if (p.name.toLowerCase().includes(word))     score += 10;
        if (p.category.toLowerCase().includes(word)) score += 5;
      }
      return { product: p, score };
    })
    .filter((s) => s.score > 0)
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

module.exports = { getAllActiveProducts, findBestMatch, getProductBySku, decrementStock };
