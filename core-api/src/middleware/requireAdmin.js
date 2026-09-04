const prisma = require('../config/db');

/**
 * Gates admin-only operations. Must run after requireAuth, which verifies
 * the JWT and populates req.merchantId.
 *
 * Checks the merchant's role live from the database rather than trusting a
 * role claim baked into the JWT — a token stays valid for up to 24h (see
 * JWT_EXPIRY in auth.route.js), so if a role is ever changed after issuing
 * a token, a JWT-only check wouldn't reflect that until the token expired.
 * This is a policy-change gate, so a stale privilege check is exactly the
 * kind of thing worth the one extra DB read to avoid.
 */
async function requireAdmin(req, res, next) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchantId },
      select: { role: true },
    });
    if (!merchant || merchant.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required for this operation.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAdmin };
