// Load and validate env first — process exits if required vars are missing
require('./config/env');

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const requestId  = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');

const authRoute     = require('./routes/auth.route');
const manifestRoute = require('./routes/manifest.route');
const matchRoute    = require('./routes/match.route');
const policyRoute   = require('./routes/policy.route');
const ordersRoute   = require('./routes/orders.route');
const auditRoute    = require('./routes/audit.route');

const { port, dashboardOrigin, nodeEnv } = require('./config/env');

const app = express();

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '256kb' }));

// ── Request ID ────────────────────────────────────────────────────────────────
app.use(requestId);

// ── CORS — locked to the dashboard origin, not wildcard ──────────────────────
const ALLOWED_ORIGINS = new Set([
  dashboardOrigin,
  // Allow agent-service internal calls (same Docker network — no CORS needed,
  // but keep localhost variants for local dev)
  'http://localhost:5173',
  'http://localhost:4100',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods',  'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',  'Content-Type, Authorization, X-Request-Id, X-Service-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Rate limiting (disabled in test env to avoid cross-test 429s) ─────────────
const isTest = nodeEnv === 'test';

const authLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true, legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });

const checkoutLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      standardHeaders: true, legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });

// ── Health check (no auth — used by Docker and load balancers) ────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'core-api', env: nodeEnv }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(authLimiter,    authRoute);     // POST /auth/register  POST /auth/login  GET /auth/me
app.use(manifestRoute);                 // GET /.well-known/agent-catalog.json  (requireAuth inside)
app.use(matchRoute);                    // POST /match           (requireServiceToken inside)
app.use(policyRoute);                   // POST /policy/check    GET/PUT /policy  (auth inside)
app.use(checkoutLimiter, ordersRoute);  // POST /orders          (requireServiceToken inside)
app.use(auditRoute);                    // GET  /audit           (requireAuth inside)

// ── Central error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let server;
if (require.main === module || process.env.NODE_ENV !== 'test') {
  server = app.listen(port, () => {
    console.log(`[core-api] Listening on port ${port} (${nodeEnv})`);
  });

  process.on('SIGTERM', () => {
    console.log('[core-api] SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
  });
}

module.exports = app;
