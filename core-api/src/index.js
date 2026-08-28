// Load and validate env first — process exits if required vars are missing
require('./config/env');

const express    = require('express');
const helmet     = require('helmet');
const requestId  = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { authLimiter } = require('./middleware/rateLimiters');

const authRoute     = require('./routes/auth.route');
const manifestRoute = require('./routes/manifest.route');
const matchRoute    = require('./routes/match.route');
const policyRoute   = require('./routes/policy.route');
const ordersRoute   = require('./routes/orders.route');
const auditRoute    = require('./routes/audit.route');

const { port, dashboardOrigin, nodeEnv } = require('./config/env');

const app = express();

// ── Trust the first proxy hop ─────────────────────────────────────────────────
// Render (and most PaaS/reverse-proxy setups) sit in front of this process.
// Without this, Express resolves req.ip to the proxy's IP for EVERY request
// instead of reading X-Forwarded-For — which silently collapses every real
// client into one shared bucket for anything IP-keyed (rate limiting here,
// but also audit logging and abuse detection generally). This was the root
// cause of "too many requests" firing for everyone, not just heavy users.
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
// helmet sets a broad set of hardening headers in one place (X-Content-Type-
// Options: nosniff, X-Frame-Options/frame-ancestors to prevent clickjacking,
// Strict-Transport-Security, a locked-down Content-Security-Policy, etc.)
// rather than relying on each response to individually get this right.
// This is a pure JSON API — no inline scripts/styles served from here — so a
// strict default-src 'none' CSP is safe and doesn't need per-route tuning.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

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

// ── Health check (no auth — used by Docker and load balancers) ────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'core-api', env: nodeEnv }));

// ── Routes ────────────────────────────────────────────────────────────────────
// authLimiter guards register/login (public, unauthenticated — IP-keyed is
// correct here). /match, /policy/check, /orders each carry their own
// merchant-scoped limiter internally (see rateLimiters.js) rather than a
// blanket router-level one, so it doesn't also throttle the JWT-authenticated
// GET/PUT /policy and GET /audit endpoints that share those route files.
app.use(authLimiter, authRoute);       // POST /auth/register  POST /auth/login  GET /auth/me
app.use(manifestRoute);                // GET /.well-known/agent-catalog.json  (requireAuth inside)
app.use(matchRoute);                   // POST /match           (requireServiceToken + rate limit inside)
app.use(policyRoute);                  // POST /policy/check, /audit/log (rate limit inside) · GET/PUT /policy (auth inside)
app.use(ordersRoute);                  // POST /orders          (requireServiceToken + rate limit inside)
app.use(auditRoute);                   // GET  /audit           (requireAuth inside)

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
