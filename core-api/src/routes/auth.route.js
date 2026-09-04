const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { z }   = require('zod');
const prisma  = require('../config/db');
const { jwtSecret } = require('../config/env');
const { requireAuth } = require('../middleware/requireAuth');
const { buildStarterCatalog } = require('../data/starterCatalog');

const router = express.Router();

const SALT_ROUNDS = 10;
const JWT_EXPIRY  = '24h';

// ── Schemas ───────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  name:     z.string().min(1).max(100).trim(),
});

const loginSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(1).max(128),
});

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/auth/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '));
      err.status = 400;
      return next(err);
    }
    const { email, password, name } = parsed.data;

    // Check for duplicate email
    const existing = await prisma.merchant.findUnique({ where: { email } });
    if (existing) {
      const err = new Error('An account with that email already exists.');
      err.status = 409;
      return next(err);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Everything below is one atomic transaction: the merchant row, its
    // starter catalog, and its policy either all commit together or none do.
    // (Previously merchant.create ran outside the transaction, so a failure
    // in the catalog/policy seeding left a permanently broken merchant row —
    // no products, no policy, and no way to retry since the email was
    // already taken.)
    const merchant = await prisma.$transaction(async (tx) => {
      const created = await tx.merchant.create({
        data: { email, passwordHash, name },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      const { products, policy } = buildStarterCatalog(created.id);
      await tx.product.createMany({ data: products });
      await tx.policy.create({ data: policy });

      return created;
    });

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      jwtSecret,
      { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
    );

    res.status(201).json({ token, merchant });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error('Invalid credentials.');
      err.status = 401;
      return next(err);
    }
    const { email, password } = parsed.data;

    const merchant = await prisma.merchant.findUnique({ where: { email } });

    // Use a dummy hash compare when merchant is not found to prevent timing attacks
    const dummyHash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    const hashToCheck = merchant ? merchant.passwordHash : dummyHash;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!merchant || !valid) {
      // Generic message — never reveal whether email or password was wrong
      const err = new Error('Invalid credentials.');
      err.status = 401;
      return next(err);
    }

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      jwtSecret,
      { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
    );

    res.json({
      token,
      merchant: { id: merchant.id, email: merchant.email, name: merchant.name, role: merchant.role, createdAt: merchant.createdAt },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchantId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!merchant) {
      const err = new Error('Merchant not found.');
      err.status = 404;
      return next(err);
    }
    res.json(merchant);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
