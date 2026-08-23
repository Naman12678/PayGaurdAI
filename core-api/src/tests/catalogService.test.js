/**
 * catalogService.test.js — SKU lookup logic, scoped by merchantId.
 */

jest.mock('../config/db', () => ({
  product: { findMany: jest.fn(), findFirst: jest.fn() },
}));

const prisma = require('../config/db');
const { findBestMatch, getProductBySku } = require('../services/catalogService');

const MERCHANT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const PRODUCTS = [
  { sku: 'MOU-001', name: 'Wireless Mouse',      price: 649,  stock: 12, category: 'electronics', active: true, merchantId: MERCHANT_ID },
  { sku: 'KBD-001', name: 'Mechanical Keyboard', price: 2499, stock:  8, category: 'electronics', active: true, merchantId: MERCHANT_ID },
  { sku: 'SPK-001', name: 'Bluetooth Speaker',   price: 1299, stock: 10, category: 'audio',       active: true, merchantId: MERCHANT_ID },
  { sku: 'PAD-001', name: 'XL Desk Mouse Pad',   price:  449, stock: 30, category: 'accessories', active: true, merchantId: MERCHANT_ID },
];

beforeEach(() => {
  jest.clearAllMocks();
  prisma.product.findMany.mockResolvedValue(PRODUCTS);
});

describe('findBestMatch', () => {
  it('matches exact SKU', async () => {
    expect((await findBestMatch('MOU-001', MERCHANT_ID)).sku).toBe('MOU-001');
  });

  it('matches exact name (case-insensitive)', async () => {
    expect((await findBestMatch('wireless mouse', MERCHANT_ID)).sku).toBe('MOU-001');
  });

  it('matches partial name', async () => {
    expect((await findBestMatch('keyboard', MERCHANT_ID)).sku).toBe('KBD-001');
  });

  it('matches by category', async () => {
    expect((await findBestMatch('audio', MERCHANT_ID)).sku).toBe('SPK-001');
  });

  it('returns highest-scoring product when multiple match (mouse > mouse pad)', async () => {
    expect((await findBestMatch('mouse', MERCHANT_ID)).sku).toBe('MOU-001');
  });

  it('returns null when nothing matches', async () => {
    expect(await findBestMatch('flying carpet', MERCHANT_ID)).toBeNull();
  });

  it('returns null when product list is empty', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    expect(await findBestMatch('mouse', MERCHANT_ID)).toBeNull();
  });

  it('ignores out-of-stock products', async () => {
    prisma.product.findMany.mockResolvedValue([{ ...PRODUCTS[0], stock: 0 }]);
    expect(await findBestMatch('mouse', MERCHANT_ID)).toBeNull();
  });
});

describe('getProductBySku', () => {
  it('returns the product when found', async () => {
    prisma.product.findFirst.mockResolvedValue(PRODUCTS[0]);
    const p = await getProductBySku('MOU-001', MERCHANT_ID);
    expect(p).not.toBeNull();
    expect(p.sku).toBe('MOU-001');
  });

  it('returns null when not found', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    expect(await getProductBySku('NONEXISTENT', MERCHANT_ID)).toBeNull();
  });
});
