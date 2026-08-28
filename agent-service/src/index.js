import express      from 'express';
import helmet       from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import checkoutRoute from './routes/checkout.route.js';

const PORT          = parseInt(process.env.PORT || '4100', 10);
const CORE_API_URL  = process.env.CORE_API_URL;
const DASHBOARD_URL = process.env.DASHBOARD_ORIGIN || 'http://localhost:5173';
const NODE_ENV       = process.env.NODE_ENV || 'development';

// ── Hard boundary: these vars must NEVER reach agent-service ─────────────────
const FORBIDDEN_VARS = ['DATABASE_URL', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'JWT_SECRET'];
const violations = FORBIDDEN_VARS.filter((v) => process.env[v]);
if (violations.length > 0) {
  console.error(`[SECURITY] agent-service must NEVER receive: ${violations.join(', ')}. Exiting.`);
  process.exit(1);
}

// ── Required vars ─────────────────────────────────────────────────────────────
const required = ['CORE_API_URL', 'GROQ_API_KEY', 'INTERNAL_SERVICE_TOKEN'];
const missing  = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[agent-service] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

// ── Trust the first proxy hop ─────────────────────────────────────────────────
// Same reasoning as core-api: without this, every client behind Render's (or
// any) reverse proxy resolves to the proxy's own IP, and the rate limiter
// below would end up sharing one bucket across every real user.
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

app.use(express.json({ limit: '256kb' }));

// ── CORS — locked to dashboard origin ────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === DASHBOARD_URL) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods',  'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',  'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Checkout rate limit — the real user-facing throttle point ────────────────
// This is the actual internet-facing entrypoint (the dashboard hits this
// directly), so this is where per-merchant abuse/cost protection belongs —
// each checkout message can trigger an LLM call plus up to three core-api
// calls, so this also indirectly protects core-api's own merchant-scoped
// limiters from being hit in the first place. Keyed by merchantId so one
// merchant's usage can't affect another's budget.
const isTest = NODE_ENV === 'test';
const checkoutLimiter = isTest ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.body?.merchantId || ipKeyGenerator(req.ip),
  message: { error: 'Too many requests, please try again later.' },
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'agent-service', coreApiUrl: CORE_API_URL })
);

app.use(checkoutLimiter, checkoutRoute);

// ── Central error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[agent-service error] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[agent-service] Listening on port ${PORT}`);
  console.log(`[agent-service] Core API: ${CORE_API_URL}`);
});

process.on('SIGTERM', () => {
  console.log('[agent-service] SIGTERM — shutting down');
  server.close(() => process.exit(0));
});

export default app;
