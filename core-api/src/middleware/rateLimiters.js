const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { nodeEnv } = require('../config/env');

const isTest = nodeEnv === 'test';
const noop = (req, res, next) => next();

/**
 * Keys internal (service-token) endpoint limits by merchantId, not by IP.
 *
 * /match, /policy/check, and /orders are only ever called by agent-service —
 * a single trusted internal caller. Every merchant's traffic funnels through
 * that one container, so an IP-keyed limiter collapses everyone into one
 * shared bucket: once any merchant's usage trips it, every other merchant
 * gets "too many requests" too, regardless of their own usage. Keying by the
 * merchantId already present in the request body scopes the limit to where
 * the actual actor is — one merchant's agent traffic can't exhaust another's.
 * Falls back to the IP (via express-rate-limit's own ipKeyGenerator, which
 * normalizes IPv6 addresses so the fallback can't be trivially bypassed by
 * cycling through an IPv6 block) only for the rare malformed request with no
 * body yet.
 */
function merchantKey(req) {
  return req.body?.merchantId || ipKeyGenerator(req.ip);
}

const authLimiter = isTest ? noop : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Generous ceiling — one checkout message can fan out into up to three
// internal calls (/match, /policy/check, /orders), and a merchant testing
// or demoing the flow can send several messages in quick succession.
const internalLimiter = isTest ? noop : rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: merchantKey,
  message: { error: 'Too many requests, please try again later.' },
});

module.exports = { authLimiter, internalLimiter };
