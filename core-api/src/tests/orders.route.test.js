/**
 * orders.route.test.js
 * Tests /orders including simulated Razorpay decline + retry path.
 */

// All env vars before any module load
process.env.DATABASE_URL           = 'postgresql://fake:fake@localhost:5432/test';
process.env.RAZORPAY_KEY_ID        = 'rzp_test_fake';
process.env.RAZORPAY_KEY_SECRET    = 'fakesecret';
process.env.JWT_SECRET             = 'test-jwt-secret-32-chars-minimum!!';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token-abc';
process.env.DASHBOARD_ORIGIN       = 'http://localhost:5173';

jest.mock('../services/policyService',  () => ({ checkPolicy: jest.fn() }));
jest.mock('../services/razorpayService',() => ({ createOrder: jest.fn() }));
jest.mock('../services/sessionService', () => ({
  incrementOrderCount: jest.fn(),
  ensureSession:       jest.fn(),
}));
jest.mock('../services/auditService', () => ({
  writeAuditLog: jest.fn(),
  getAuditLog:   jest.fn(),
}));
jest.mock('../services/catalogService', () => ({ getProductBySku: jest.fn() }));

const request = require('supertest');
const app     = require('../index');

const { checkPolicy }        = require('../services/policyService');
const { createOrder }        = require('../services/razorpayService');
const { incrementOrderCount, ensureSession } = require('../services/sessionService');
const { writeAuditLog, getAuditLog }         = require('../services/auditService');
const { getProductBySku }    = require('../services/catalogService');

const MERCHANT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SESSION_ID  = '11111111-1111-1111-1111-111111111111';
const SVC_TOKEN   = process.env.INTERNAL_SERVICE_TOKEN;

const VALID_BODY = {
  sku:        'MOU-001',
  quantity:   1,
  amount:     649,
  sessionId:  SESSION_ID,
  intentText: 'I want to buy a wireless mouse',
  merchantId: MERCHANT_ID,
};

beforeEach(() => {
  jest.clearAllMocks();
  ensureSession.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 0, merchantId: MERCHANT_ID });
  getProductBySku.mockResolvedValue({
    sku: 'MOU-001', name: 'Wireless Mouse', price: 649, stock: 12, merchantId: MERCHANT_ID,
  });
  getAuditLog.mockResolvedValue([]); // no existing idempotency match
});

// ── No service token ───────────────────────────────────────────────────────────
describe('Service token gate', () => {
  it('returns 401 when X-Service-Token is absent', async () => {
    const res = await request(app).post('/orders').send(VALID_BODY);
    expect(res.status).toBe(401);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('returns 401 when X-Service-Token is wrong', async () => {
    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', 'wrong-token')
      .send(VALID_BODY);
    expect(res.status).toBe(401);
  });
});

// ── Success path ───────────────────────────────────────────────────────────────
describe('POST /orders — success path', () => {
  it('returns outcome=success with razorpayOrderId', async () => {
    checkPolicy.mockResolvedValue({ verdict: 'pass', rule: null, reason: null });
    createOrder.mockResolvedValue({ outcome: 'success', razorpayOrderId: 'order_test_123' });
    incrementOrderCount.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 1 });

    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', SVC_TOKEN)
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('success');
    expect(res.body.razorpayOrderId).toBe('order_test_123');
    expect(writeAuditLog).toHaveBeenCalledTimes(1);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'success', merchantId: MERCHANT_ID })
    );
  });
});

// ── Policy block ───────────────────────────────────────────────────────────────
describe('POST /orders — policy block', () => {
  it('returns 403, no Razorpay call, writes blocked audit row', async () => {
    checkPolicy.mockResolvedValue({
      verdict: 'block', rule: 'max_order_amount',
      reason:  'Order amount 649 exceeds cap of 500',
    });

    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', SVC_TOKEN)
      .send(VALID_BODY);

    expect(res.status).toBe(403);
    expect(res.body.outcome).toBe('blocked');
    expect(res.body.rule).toBe('max_order_amount');
    expect(createOrder).not.toHaveBeenCalled();
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'blocked', merchantId: MERCHANT_ID })
    );
  });
});

// ── Razorpay decline + retry (the most important failure-path test) ─────────────
describe('POST /orders — Razorpay decline with retry', () => {
  it('returns outcome=failed, no session increment, writes one audit row', async () => {
    checkPolicy.mockResolvedValue({ verdict: 'pass', rule: null, reason: null });
    // razorpayService handles the internal retry; returns failed to the route
    createOrder.mockResolvedValue({
      outcome: 'failed',
      reason:  'Payment gateway unavailable after retry.',
    });

    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', SVC_TOKEN)
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('failed');
    expect(res.body.reason).toMatch(/unavailable/);

    // Session counter must NOT be incremented on failure
    expect(incrementOrderCount).not.toHaveBeenCalled();

    // Exactly one audit row, with correct fields
    expect(writeAuditLog).toHaveBeenCalledTimes(1);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'failed', policyVerdict: 'pass', merchantId: MERCHANT_ID })
    );
  });
});

// ── Idempotency ────────────────────────────────────────────────────────────────
describe('POST /orders — idempotency', () => {
  it('returns cached success without calling Razorpay again', async () => {
    getAuditLog.mockResolvedValue([{
      id: 5, outcome: 'success', razorpayOrderId: 'order_cached_xyz',
      idempotencyKey: 'idem-key-001', merchantId: MERCHANT_ID,
    }]);

    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', SVC_TOKEN)
      .send({ ...VALID_BODY, idempotencyKey: 'idem-key-001' });

    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('success');
    expect(res.body.razorpayOrderId).toBe('order_cached_xyz');
    expect(res.body.idempotent).toBe(true);
    expect(createOrder).not.toHaveBeenCalled();
  });
});

// ── Validation errors ──────────────────────────────────────────────────────────
describe('POST /orders — validation', () => {
  it('returns 400 when sessionId is missing', async () => {
    const { sessionId: _, ...body } = VALID_BODY;
    const res = await request(app)
      .post('/orders').set('X-Service-Token', SVC_TOKEN).send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post('/orders').set('X-Service-Token', SVC_TOKEN)
      .send({ ...VALID_BODY, amount: -100 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when merchantId is missing', async () => {
    const { merchantId: _, ...body } = VALID_BODY;
    const res = await request(app)
      .post('/orders').set('X-Service-Token', SVC_TOKEN).send(body);
    expect(res.status).toBe(400);
  });
});
