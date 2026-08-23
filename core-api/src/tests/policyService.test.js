/**
 * policyService.test.js
 * Exhaustive pass/block test suite — every rule needs an explicit pass AND block case.
 */

jest.mock('../config/db', () => ({
  policy: { findFirst: jest.fn() },
  session: { findFirst: jest.fn(), upsert: jest.fn() },
}));

const prisma = require('../config/db');
const { checkPolicy } = require('../services/policyService');

const MERCHANT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SESSION_ID  = '00000000-0000-0000-0000-000000000001';

const BASE_POLICY = {
  id: 1, maxOrderAmount: 4000,
  allowedSkus: ['MOU-001', 'KBD-001', 'SPK-001'],
  maxOrdersPerSession: 3, merchantId: MERCHANT_ID,
};

function call(overrides = {}) {
  return checkPolicy({ sku: 'MOU-001', amount: 649, sessionId: SESSION_ID, merchantId: MERCHANT_ID, ...overrides });
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.policy.findFirst.mockResolvedValue(BASE_POLICY);
  prisma.session.findFirst.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 0, merchantId: MERCHANT_ID });
});

describe('no policy configured', () => {
  it('blocks when no policy row exists', async () => {
    prisma.policy.findFirst.mockResolvedValue(null);
    const r = await call();
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('no_policy');
  });
});

describe('sku_allow_list rule', () => {
  it('passes for an allowed SKU', async () => {
    const r = await call();
    expect(r.verdict).toBe('pass');
    expect(r.rule).toBeNull();
  });

  it('blocks for a SKU not on the allow list', async () => {
    const r = await call({ sku: 'MON-001', amount: 8999 });
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('sku_allow_list');
    expect(r.reason).toMatch(/MON-001/);
  });

  it('blocks for an empty-string SKU', async () => {
    const r = await call({ sku: '' });
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('sku_allow_list');
  });
});

describe('max_order_amount rule', () => {
  it('passes when total equals the cap exactly', async () => {
    const r = await call({ amount: 4000 });
    expect(r.verdict).toBe('pass');
  });

  it('blocks when total exceeds the cap by 1', async () => {
    const r = await call({ amount: 4001 });
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('max_order_amount');
    expect(r.reason).toMatch(/4001/);
    expect(r.reason).toMatch(/4000/);
  });

  it('blocks when quantity pushes total over cap (1299 × 4 = 5196)', async () => {
    const r = await call({ sku: 'SPK-001', amount: 1299, quantity: 4 });
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('max_order_amount');
  });

  it('passes when quantity keeps total under cap (649 × 3 = 1947)', async () => {
    const r = await call({ amount: 649, quantity: 3 });
    expect(r.verdict).toBe('pass');
  });
});

describe('max_orders_per_session rule', () => {
  it('passes when session is new (0 orders placed)', async () => {
    prisma.session.findFirst.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 0, merchantId: MERCHANT_ID });
    expect((await call()).verdict).toBe('pass');
  });

  it('passes at limit minus one (2 of 3)', async () => {
    prisma.session.findFirst.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 2, merchantId: MERCHANT_ID });
    expect((await call()).verdict).toBe('pass');
  });

  it('blocks when session has hit the limit', async () => {
    prisma.session.findFirst.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 3, merchantId: MERCHANT_ID });
    const r = await call();
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('max_orders_per_session');
    expect(r.reason).toMatch(/3/);
  });

  it('blocks when session exceeded the limit', async () => {
    prisma.session.findFirst.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 5, merchantId: MERCHANT_ID });
    const r = await call();
    expect(r.verdict).toBe('block');
  });

  it('passes when session row does not exist (treated as 0 orders)', async () => {
    prisma.session.findFirst.mockResolvedValue(null);
    expect((await call()).verdict).toBe('pass');
  });
});

describe('rule evaluation order', () => {
  it('reports sku_allow_list before max_order_amount when both would block', async () => {
    const r = await call({ sku: 'MON-001', amount: 99999 });
    expect(r.verdict).toBe('block');
    expect(r.rule).toBe('sku_allow_list');
  });
});
