import express    from 'express';
import { v4 as uuidv4 } from 'uuid';
import { buildGraph }   from '../graph/buildGraph.js';

const router = express.Router();
const checkoutGraph = buildGraph(); // stateless — safe to reuse

/**
 * POST /checkout
 * Body: { intentText: string, sessionId?: UUID, merchantId: UUID }
 *
 * merchantId identifies which merchant's catalog and policy to use.
 * The agent-service itself never validates the merchantId — that's core-api's job.
 * This route simply passes it through so core-api can scope every query.
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const { intentText, sessionId, merchantId } = req.body;

    if (!intentText || typeof intentText !== 'string' || !intentText.trim()) {
      return res.status(400).json({ error: 'intentText is required.' });
    }
    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required.' });
    }

    // Sanitise: strip prompt-injection attempts (angle-bracket HTML/XML tags)
    const safeIntent = intentText.replace(/<[^>]{0,200}>/g, '').slice(0, 500).trim();

    const sid       = sessionId || uuidv4();
    const requestId = uuidv4();

    const finalState = await checkoutGraph.invoke({
      intentText:      safeIntent,
      sessionId:       sid,
      requestId,
      merchantId,
      stage:           'start',
      resolvedProduct: null,
      quantity:        1,
      policyVerdict:   null,
      policyRule:      null,
      policyReason:    null,
      outcome:         null,
      razorpayOrderId: null,
      matchOutcome:    null,
      message:         null,
      error:           null,
    });

    const status = finalState.outcome === 'blocked' ? 403
      : finalState.stage   === 'error'   ? 422
      : 200;

    res.status(status).json({
      sessionId: sid,
      requestId,
      outcome:         finalState.outcome  || 'error',
      message:         finalState.message  || finalState.error || 'An unexpected error occurred.',
      razorpayOrderId: finalState.razorpayOrderId || null,
      policyRule:      finalState.policyRule      || null,
      policyReason:    finalState.policyReason    || null,
      resolvedProduct: finalState.resolvedProduct || null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
