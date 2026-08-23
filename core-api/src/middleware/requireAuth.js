const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

/**
 * Merchant JWT auth middleware.
 * Reads Authorization: Bearer <token>, verifies signature + expiry,
 * attaches req.merchantId from the payload.
 * All routes that touch merchant data must use this middleware.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.merchantId = payload.merchantId;
    req.merchantEmail = payload.email;
    next();
  } catch (err) {
    // Distinguish expired vs. invalid for logging, but return same 401 to client
    const message = err.name === 'TokenExpiredError'
      ? 'Token has expired.'
      : 'Invalid token.';
    return res.status(401).json({ error: message });
  }
}

module.exports = { requireAuth };
