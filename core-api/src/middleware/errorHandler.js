/**
 * Central error handler. Converts thrown errors into JSON responses.
 * Never leaks stack traces to the client - they go to stderr only.
 * All unhandled cases fail closed with a 500.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Always log to stderr with the request ID for traceability
  console.error(`[error] requestId=${req.requestId} status=${status} message=${message}`);
  if (status === 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: message,
    requestId: req.requestId,
  });
}

module.exports = errorHandler;
