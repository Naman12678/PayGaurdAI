import express      from 'express';
import checkoutRoute from './routes/checkout.route.js';

const PORT          = parseInt(process.env.PORT || '4100', 10);
const CORE_API_URL  = process.env.CORE_API_URL;
const DASHBOARD_URL = process.env.DASHBOARD_ORIGIN || 'http://localhost:5173';

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

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'agent-service', coreApiUrl: CORE_API_URL })
);

app.use(checkoutRoute);

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
