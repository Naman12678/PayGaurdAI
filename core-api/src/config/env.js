/**
 * Loads and validates all required environment variables at startup.
 * The process exits immediately if any required variable is missing.
 * This makes misconfigurations obvious at boot rather than at runtime.
 */

const required = [
  'DATABASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'JWT_SECRET',
  'INTERNAL_SERVICE_TOKEN',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  databaseUrl:           process.env.DATABASE_URL,
  razorpayKeyId:         process.env.RAZORPAY_KEY_ID,
  razorpaySecret:        process.env.RAZORPAY_KEY_SECRET,
  jwtSecret:             process.env.JWT_SECRET,
  internalServiceToken:  process.env.INTERNAL_SERVICE_TOKEN,
  dashboardOrigin:       process.env.DASHBOARD_ORIGIN || 'http://localhost:5173',
  port:                  parseInt(process.env.PORT || '4000', 10),
  nodeEnv:               process.env.NODE_ENV || 'development',
};
