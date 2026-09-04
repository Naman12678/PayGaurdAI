const { z } = require('zod');

/**
 * Validates request bodies with Zod schemas.
 * Returns a middleware that throws a 400 error if validation fails.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const err = new Error(
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      );
      err.status = 400;
      return next(err);
    }
    req.body = result.data;
    next();
  };
}

// ── Schema definitions ─────────────────────────────────────────────────────────

const matchSchema = z.object({
  query:      z.string().min(1).max(500),
  sessionId:  z.string().uuid().optional(),
  merchantId: z.string().uuid(),
  intentText: z.string().min(1).max(1000).optional(),
});

const policyCheckSchema = z.object({
  sku:        z.string().min(1),
  amount:     z.number().int().positive(),
  sessionId:  z.string().uuid(),
  quantity:   z.number().int().positive().default(1),
  merchantId: z.string().uuid(),
  intentText: z.string().min(1).max(1000).optional(),
});

const createOrderSchema = z.object({
  sku:             z.string().min(1),
  quantity:        z.number().int().positive().default(1),
  amount:          z.number().int().positive(),
  sessionId:       z.string().uuid(),
  intentText:      z.string().min(1).max(1000),
  merchantId:      z.string().uuid(),
  idempotencyKey:  z.string().max(128).optional(),
});

const auditLogSchema = z.object({
  sessionId:  z.string().uuid().optional(),
  merchantId: z.string().uuid(),
  intentText: z.string().min(1).max(1000),
  outcome:    z.enum(['no_match', 'blocked', 'failed']),
  reason:     z.string().max(1000).optional(),
});

const restockSchema = z.object({
  stock: z.number().int().min(0).max(1_000_000),
});

module.exports = {
  validate,
  matchSchema,
  policyCheckSchema,
  createOrderSchema,
  auditLogSchema,
  restockSchema,
};
