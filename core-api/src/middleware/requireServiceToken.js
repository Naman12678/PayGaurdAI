const { internalServiceToken } = require('../config/env');

/**
 * Service-to-service auth middleware.
 * Used on endpoints called by agent-service (POST /match, /policy/check, /orders).
 * Checks for X-Service-Token header matching INTERNAL_SERVICE_TOKEN env var.
 *
 * This is intentionally separate from merchant JWT auth:
 * - agent-service never receives a merchant JWT or JWT_SECRET
 * - merchant browser clients never receive INTERNAL_SERVICE_TOKEN
 */
function requireServiceToken(req, res, next) {
  const token = req.headers['x-service-token'];
  if (!token || token !== internalServiceToken) {
    return res.status(401).json({ error: 'Service token missing or invalid.' });
  }
  next();
}

module.exports = { requireServiceToken };
