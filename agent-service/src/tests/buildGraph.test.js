/**
 * buildGraph.test.js
 *
 * Critical integration test: asserts that a policy-blocked order
 * NEVER reaches the place_order (coreApiClient.placeOrder) tool call.
 */

// Mock coreApiClient
const mockMatchProduct = jest.fn();
const mockCheckPolicy = jest.fn();
const mockPlaceOrder = jest.fn();

jest.mock('../tools/coreApiClient.js', () => ({
  matchProduct: (...args) => mockMatchProduct(...args),
  checkPolicy: (...args) => mockCheckPolicy(...args),
  placeOrder: (...args) => mockPlaceOrder(...args),
}));

// Mock LLM
const mockGroqInvoke = jest.fn();
jest.mock('../llm/groqClient.js', () => ({
  createGroqClient: () => ({ invoke: mockGroqInvoke }),
}));
jest.mock('../llm/fallbackClient.js', () => ({
  createFallbackClient: () => ({ invoke: jest.fn() }),
  withFallback: async (primaryFn) => primaryFn(),
}));

import { buildGraph } from '../graph/buildGraph.js';

const SESSION_ID = '00000000-0000-0000-0000-000000000001';
const REQUEST_ID = '00000000-0000-0000-0000-000000000002';

const MOUSE_PRODUCT = {
  sku: 'MOU-001', name: 'Wireless Mouse', price: 649, stock: 12, category: 'electronics',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('buildGraph - policy block must never reach placeOrder', () => {
  it('stops at checkout stage and never calls placeOrder when policy blocks', async () => {
    mockGroqInvoke.mockResolvedValue({
      content: JSON.stringify({ query: 'wireless mouse', quantity: 1, confidence: 0.95 }),
    });
    mockMatchProduct.mockResolvedValue({ outcome: 'matched', product: MOUSE_PRODUCT });
    mockCheckPolicy.mockResolvedValue({
      verdict: 'block',
      rule: 'max_order_amount',
      reason: 'Order amount 649 exceeds cap of 500',
    });

    const graph = buildGraph();
    const result = await graph.invoke({
      intentText: 'I want to buy a wireless mouse',
      sessionId: SESSION_ID,
      requestId: REQUEST_ID,
      stage: 'start',
      resolvedProduct: null,
      quantity: 1,
      policyVerdict: null,
      policyRule: null,
      policyReason: null,
      outcome: null,
      razorpayOrderId: null,
      matchOutcome: null,
      message: null,
      error: null,
    });

    // The graph must have reached blocked state
    expect(result.outcome).toBe('blocked');
    expect(result.policyRule).toBe('max_order_amount');

    // placeOrder must NEVER have been called
    expect(mockPlaceOrder).not.toHaveBeenCalled();
  });

  it('calls placeOrder exactly once when policy passes', async () => {
    mockGroqInvoke.mockResolvedValue({
      content: JSON.stringify({ query: 'wireless mouse', quantity: 1, confidence: 0.95 }),
    });
    mockMatchProduct.mockResolvedValue({ outcome: 'matched', product: MOUSE_PRODUCT });
    mockCheckPolicy.mockResolvedValue({ verdict: 'pass', rule: null, reason: null });
    mockPlaceOrder.mockResolvedValue({ outcome: 'success', razorpayOrderId: 'order_test_abc' });

    const graph = buildGraph();
    const result = await graph.invoke({
      intentText: 'I want to buy a wireless mouse',
      sessionId: SESSION_ID,
      requestId: REQUEST_ID,
      stage: 'start',
      resolvedProduct: null,
      quantity: 1,
      policyVerdict: null,
      policyRule: null,
      policyReason: null,
      outcome: null,
      razorpayOrderId: null,
      matchOutcome: null,
      message: null,
      error: null,
    });

    expect(result.outcome).toBe('success');
    expect(result.razorpayOrderId).toBe('order_test_abc');
    expect(mockPlaceOrder).toHaveBeenCalledTimes(1);
  });
});
