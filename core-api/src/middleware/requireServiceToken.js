const crypto = require('crypto');
const { internalServiceToken } = require('../config/env');

/**
 * Service-to-service auth middleware.
 * Used on endpoints called by agent-service (POST /match, /policy/check, /orders).
 * Checks for X-Service-Token header matching INTERNAL_SERVICE_TOKEN env var.
 *
 * Uses a constant-time comparison (crypto.timingSafeEqual) rather than plain
 * `===` — a naive string comparison exits on the first mismatched byte, and
 * an attacker measuring response latency across many attempts could use that
 * to recover the token one character at a time. Length is checked first
 * (timingSafeEqual throws on length mismatch), and unequal-length inputs are
 * padded before comparison so even a wrong-length guess doesn't leak that
 * fact through timing.
 *
 * This is intentionally separate from merchant JWT auth:
 * - agent-service never receives a merchant JWT or JWT_SECRET
 * - merchant browser clients never receive INTERNAL_SERVICE_TOKEN
 */
function requireServiceToken(req, res, next) {
  const token = req.headers['x-service-token'];

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Service token missing or invalid.' });
  }

  const expected = Buffer.from(internalServiceToken, 'utf8');
  const provided = Buffer.from(token, 'utf8');
  const matches =
    expected.length === provided.length &&
    crypto.timingSafeEqual(expected, provided);

  if (!matches) {
    return res.status(401).json({ error: 'Service token missing or invalid.' });
  }
  next();
}

module.exports = { requireServiceToken };
