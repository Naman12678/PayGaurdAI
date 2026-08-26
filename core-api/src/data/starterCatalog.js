'use strict';

/**
 * starterCatalog.js
 *
 * Every merchant needs their own products before the checkout agent can match
 * anything against `/match`. Previously only the seeded demo account
 * (demo@demo.com) had products — any freshly registered merchant had an
 * empty catalog, so the agent correctly (but confusingly) reported
 * "no such product available" for every request.
 *
 * This module gives each new merchant a starter catalog + policy at
 * registration time, so the checkout demo works immediately for any account.
 *
 * NOTE: `Product.sku` is a global primary key (not scoped per merchant in the
 * schema), so we suffix each SKU with a short slice of the merchant's id to
 * keep them unique across merchants.
 */

const BASE_PRODUCTS = [
  { sku: 'MOU', name: 'Wireless Mouse',              price:  649, stock: 12, category: 'electronics' },
  { sku: 'KBD', name: 'Mechanical Keyboard',         price: 2499, stock:  8, category: 'electronics' },
  { sku: 'MON', name: '24-inch LED Monitor',         price: 8999, stock:  5, category: 'electronics' },
  { sku: 'USB', name: 'USB-C Hub 7-in-1',            price:  999, stock: 20, category: 'accessories' },
  { sku: 'CAB', name: 'USB-C Charging Cable 2m',     price:  299, stock: 50, category: 'accessories' },
  { sku: 'BAG', name: 'Laptop Backpack 15.6"',       price: 1499, stock: 15, category: 'bags' },
  { sku: 'WEB', name: '1080p Webcam',                price: 1999, stock:  7, category: 'electronics' },
  { sku: 'SPK', name: 'Bluetooth Speaker',           price: 1299, stock: 10, category: 'audio' },
  { sku: 'HDN', name: 'Noise Cancelling Headphones', price: 3499, stock:  6, category: 'audio' },
  { sku: 'PAD', name: 'XL Desk Mouse Pad',           price:  449, stock: 30, category: 'accessories' },
  { sku: 'SSD', name: 'Portable SSD 1TB',            price: 4999, stock:  4, category: 'storage' },
  { sku: 'PWR', name: '65W GaN Charger',             price:  799, stock: 18, category: 'accessories' },
];

/**
 * Builds a starter product list + default policy for a given merchant id.
 * SKUs are namespaced with the merchant id so they never collide with
 * another merchant's catalog (or the seeded demo catalog).
 */
function buildStarterCatalog(merchantId) {
  const suffix = merchantId.replace(/-/g, '').slice(0, 8).toUpperCase();

  const products = BASE_PRODUCTS.map((p) => ({
    ...p,
    sku: `${p.sku}-${suffix}`,
    active: true,
    merchantId,
  }));

  const policy = {
    maxOrderAmount: 4000,
    allowedSkus: products
      .filter((p) => p.sku.slice(0, 3) !== 'MON' && p.sku.slice(0, 3) !== 'SSD') // keep two SKUs blocked out of the box, mirrors the demo policy's intent
      .map((p) => p.sku),
    maxOrdersPerSession: 3,
    merchantId,
  };

  return { products, policy };
}

module.exports = { buildStarterCatalog };
