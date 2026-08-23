const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a UUID to every request as req.requestId.
 * The ID is threaded through to every audit_log row, making it trivial
 * to trace a single request through all log entries.
 */
function requestId(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = requestId;
