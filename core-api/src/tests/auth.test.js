/**
 * auth.test.js — all 7 required auth/authorization tests
 *
 * Tests:
 *  1. Register succeeds with a new email; fails with duplicate (409)
 *  2. Login succeeds with correct credentials; fails with wrong password (401);
 *     fails with unknown email (401, same generic message)
 *  3. Protected endpoint with no Authorization header → 401
 *  4. Protected endpoint with malformed / expired token → 401
 *  5. Merchant A's token cannot read Merchant B's audit log (404/empty, not B's data)
 *  6. agent-service → core-api calls without service token are rejected (401)
 *  7. Full checkout flow works end-to-end with valid merchant JWT (mocked Razorpay)
 */

// ── Env must be set before any module that calls require('./config/env') ──────
process.env.DATABASE_URL           = 'postgresql://fake:fake@localhost:5432/test';
process.env.RAZORPAY_KEY_ID        = 'rzp_test_fake';
process.env.RAZORPAY_KEY_SECRET    = 'fakesecret';
process.env.JWT_SECRET             = 'test-jwt-secret-32-chars-minimum!!';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token-abc';
process.env.DASHBOARD_ORIGIN       = 'http://localhost:5173';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
const mockMerchantA = {
  id:           'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email:        'merchant-a@test.com',
  passwordHash: '',   // filled in beforeAll
  name:         'Merchant A',
  createdAt:    new Date(),
};
const mockMerchantB = {
  id:           'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  email:        'merchant-b@test.com',
  passwordHash: '',
  name:         'Merchant B',
  createdAt:    new Date(),
};

jest.mock('../config/db', () => ({
  merchant: {
    findUnique: jest.fn(),
    create:     jest.fn(),
  },
  policy: {
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
  },
  session: {
    findFirst:  jest.fn(),
    upsert:     jest.fn(),
    findUnique: jest.fn(),
  },
  auditLog: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    findFirst: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    findMany:  jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw:    jest.fn(),
}));

jest.mock('../services/razorpayService', () => ({
  createOrder: jest.fn(),
}));

// Pre-mock policyService so test 5 can spy on updatePolicy cleanly
jest.mock('../services/policyService', () => ({
  checkPolicy:      jest.fn().mockResolvedValue({ verdict: 'pass', rule: null, reason: null }),
  getCurrentPolicy: jest.fn(),
  updatePolicy:     jest.fn(),
}));

const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const request = require('supertest');
const prisma  = require('../config/db');
const { createOrder } = require('../services/razorpayService');
const app = require('../index');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeToken(merchantId, email, secret = process.env.JWT_SECRET, expiresIn = '24h') {
  return jwt.sign({ merchantId, email }, secret, { expiresIn });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Register
// ─────────────────────────────────────────────────────────────────────────────
describe('1 — POST /auth/register', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockMerchantA.passwordHash = await bcrypt.hash('Password1!', 10);
  });

  it('succeeds with a new email and returns a JWT', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);           // no existing merchant
    prisma.merchant.create.mockResolvedValue(mockMerchantA);

    const res = await request(app).post('/auth/register').send({
      email: 'merchant-a@test.com', password: 'Password1!', name: 'Merchant A',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.merchant.email).toBe('merchant-a@test.com');

    // Token must decode to the correct merchantId
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.merchantId).toBe(mockMerchantA.id);
  });

  it('returns 409 on duplicate email', async () => {
    prisma.merchant.findUnique.mockResolvedValue(mockMerchantA);  // already exists

    const res = await request(app).post('/auth/register').send({
      email: 'merchant-a@test.com', password: 'Password1!', name: 'Merchant A',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
    expect(prisma.merchant.create).not.toHaveBeenCalled();
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'x@test.com', password: 'short', name: 'X',
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Login
// ─────────────────────────────────────────────────────────────────────────────
describe('2 — POST /auth/login', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockMerchantA.passwordHash = await bcrypt.hash('Password1!', 10);
  });

  it('succeeds with correct credentials and returns a JWT', async () => {
    prisma.merchant.findUnique.mockResolvedValue(mockMerchantA);

    const res = await request(app).post('/auth/login').send({
      email: 'merchant-a@test.com', password: 'Password1!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.merchantId).toBe(mockMerchantA.id);
  });

  it('returns 401 with wrong password — generic message', async () => {
    prisma.merchant.findUnique.mockResolvedValue(mockMerchantA);

    const res = await request(app).post('/auth/login').send({
      email: 'merchant-a@test.com', password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials.');
  });

  it('returns 401 for unknown email — same generic message (no email enumeration)', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);           // unknown email

    const res = await request(app).post('/auth/login').send({
      email: 'nobody@test.com', password: 'Password1!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Protected endpoint — no Authorization header
// ─────────────────────────────────────────────────────────────────────────────
describe('3 — GET /audit with no Authorization header → 401', () => {
  it('rejects with 401', async () => {
    const res = await request(app).get('/audit');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authorization/i);
  });

  it('also rejects PUT /policy with no header', async () => {
    const res = await request(app).put('/policy').send({
      maxOrderAmount: 9999, allowedSkus: ['MOU-001'], maxOrdersPerSession: 5,
    });
    expect(res.status).toBe(401);
  });

  it('also rejects GET /.well-known/agent-catalog.json with no header', async () => {
    const res = await request(app).get('/.well-known/agent-catalog.json');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Malformed / expired token → 401
// ─────────────────────────────────────────────────────────────────────────────
describe('4 — Malformed / expired tokens → 401', () => {
  it('rejects a garbage token', async () => {
    const res = await request(app)
      .get('/audit')
      .set('Authorization', 'Bearer this.is.garbage');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const bad = makeToken(mockMerchantA.id, mockMerchantA.email, 'wrong-secret');
    const res = await request(app)
      .get('/audit')
      .set('Authorization', `Bearer ${bad}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = makeToken(mockMerchantA.id, mockMerchantA.email, process.env.JWT_SECRET, '-1s');
    const res = await request(app)
      .get('/audit')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('rejects Bearer with no token value', async () => {
    const res = await request(app)
      .get('/audit')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Merchant A cannot read Merchant B's data
// ─────────────────────────────────────────────────────────────────────────────
describe('5 — Merchant isolation: A cannot read B\'s audit log', () => {
  it('returns empty entries (not B\'s data) when A queries audit', async () => {
    const tokenA = makeToken(mockMerchantA.id, mockMerchantA.email);

    // core-api will filter by merchantId = A's id, so B's rows never appear
    prisma.auditLog.findMany.mockResolvedValue([]);  // A has no rows

    const res = await request(app)
      .get('/audit')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);

    // Verify the DB was queried with A's merchantId, not B's
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ merchantId: mockMerchantA.id }),
      })
    );
  });

  it('A cannot overwrite B\'s policy — PUT /policy is scoped to the token owner', async () => {
    const tokenA = makeToken(mockMerchantA.id, mockMerchantA.email);
    const { updatePolicy } = require('../services/policyService');
    updatePolicy.mockResolvedValue({
      id: 1, merchantId: mockMerchantA.id, maxOrderAmount: 100,
      allowedSkus: ['MOU-001'], maxOrdersPerSession: 1,
    });

    const res = await request(app)
      .put('/policy')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ maxOrderAmount: 100, allowedSkus: ['MOU-001'], maxOrdersPerSession: 1 });

    expect(res.status).toBe(200);
    // Confirm updatePolicy was called with A's merchantId (not B's)
    expect(updatePolicy).toHaveBeenCalledWith(
      expect.objectContaining({ maxOrderAmount: 100 }),
      mockMerchantA.id
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. agent-service → core-api calls without service token → 401
// ─────────────────────────────────────────────────────────────────────────────
describe('6 — Service token required on internal endpoints', () => {
  it('POST /match without X-Service-Token → 401', async () => {
    const res = await request(app).post('/match').send({
      query: 'mouse', merchantId: mockMerchantA.id,
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/service token/i);
  });

  it('POST /policy/check without X-Service-Token → 401', async () => {
    const res = await request(app).post('/policy/check').send({
      sku: 'MOU-001', amount: 649, sessionId: '11111111-1111-1111-1111-111111111111',
      merchantId: mockMerchantA.id,
    });
    expect(res.status).toBe(401);
  });

  it('POST /orders without X-Service-Token → 401', async () => {
    const res = await request(app).post('/orders').send({
      sku: 'MOU-001', quantity: 1, amount: 649,
      sessionId: '11111111-1111-1111-1111-111111111111',
      intentText: 'buy a mouse', merchantId: mockMerchantA.id,
    });
    expect(res.status).toBe(401);
  });

  it('POST /match with correct X-Service-Token passes the gate', async () => {
    prisma.product.findMany.mockResolvedValue([
      { sku: 'MOU-001', name: 'Wireless Mouse', price: 649, stock: 12, category: 'electronics', active: true, merchantId: mockMerchantA.id },
    ]);

    const res = await request(app)
      .post('/match')
      .set('X-Service-Token', process.env.INTERNAL_SERVICE_TOKEN)
      .send({ query: 'mouse', merchantId: mockMerchantA.id });

    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('matched');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Full checkout flow end-to-end with valid service token
// ─────────────────────────────────────────────────────────────────────────────
describe('7 — Full checkout flow with valid service token', () => {
  const SESSION_ID = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    jest.clearAllMocks();

    const { checkPolicy } = require('../services/policyService');

    // Policy: pass (default for most tests in this describe block)
    checkPolicy.mockResolvedValue({ verdict: 'pass', rule: null, reason: null });
    // Session: 0 orders placed
    prisma.session.findFirst.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 0, merchantId: mockMerchantA.id });
    prisma.session.upsert.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 0, merchantId: mockMerchantA.id });
    prisma.session.findUnique.mockResolvedValue({ sessionId: SESSION_ID, ordersPlaced: 0, merchantId: mockMerchantA.id });
    // Product: in stock
    prisma.product.findFirst.mockResolvedValue({
      sku: 'MOU-001', name: 'Wireless Mouse', price: 649, stock: 12,
      category: 'electronics', active: true, merchantId: mockMerchantA.id,
    });
    // Razorpay: success
    createOrder.mockResolvedValue({ outcome: 'success', razorpayOrderId: 'order_test_e2e' });
    // Audit write succeeds
    prisma.auditLog.create.mockResolvedValue({ id: 1 });
    prisma.auditLog.findMany.mockResolvedValue([]);  // no existing idempotency match
    // Session increment
    prisma.$transaction.mockImplementation(async (fn) => {
      const txMock = {
        session: {
          upsert: jest.fn().mockResolvedValue({}),
        },
        $queryRaw: jest.fn().mockResolvedValue([{ session_id: SESSION_ID, orders_placed: 1 }]),
      };
      return fn(txMock);
    });
  });

  it('returns outcome=success with a razorpayOrderId when service token is valid', async () => {
    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', process.env.INTERNAL_SERVICE_TOKEN)
      .send({
        sku: 'MOU-001', quantity: 1, amount: 649,
        sessionId:  SESSION_ID,
        intentText: 'I want to buy a wireless mouse',
        merchantId: mockMerchantA.id,
      });

    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('success');
    expect(res.body.razorpayOrderId).toBe('order_test_e2e');

    // Audit row must have been written exactly once
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome:    'success',
          merchantId: mockMerchantA.id,
        }),
      })
    );

    // Razorpay was called exactly once (no spurious retries)
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it('blocked policy never reaches Razorpay', async () => {
    const { checkPolicy } = require('../services/policyService');
    checkPolicy.mockResolvedValue({
      verdict: 'block', rule: 'max_order_amount',
      reason:  'Order amount 649 exceeds cap of 100',
    });

    const res = await request(app)
      .post('/orders')
      .set('X-Service-Token', process.env.INTERNAL_SERVICE_TOKEN)
      .send({
        sku: 'MOU-001', quantity: 1, amount: 649,
        sessionId:  SESSION_ID,
        intentText: 'I want a mouse',
        merchantId: mockMerchantA.id,
      });

    expect(res.status).toBe(403);
    expect(res.body.outcome).toBe('blocked');
    expect(createOrder).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ outcome: 'blocked' }),
      })
    );
  });
});
