/**
 * intentResolver.test.js
 *
 * Tests for the intentResolver node in isolation.
 * Mocks both the LLM clients and the coreApiClient.
 */

import { intentResolverNode } from '../graph/nodes/intentResolver.node.js';

// Mock LLM clients
const mockGroqInvoke = jest.fn();
jest.mock('../llm/groqClient.js', () => ({
  createGroqClient: () => ({ invoke: mockGroqInvoke }),
}));
jest.mock('../llm/fallbackClient.js', () => ({
  createFallbackClient: () => ({ invoke: jest.fn() }),
  withFallback: async (primaryFn) => primaryFn(),
}));

// Mock coreApiClient
const mockMatchProduct = jest.fn();
jest.mock('../tools/coreApiClient.js', () => ({
  matchProduct: (...args) => mockMatchProduct(...args),
}));

const BASE_STATE = {
  intentText: 'I want to buy a wireless mouse',
  sessionId: '00000000-0000-0000-0000-000000000001',
  requestId: '00000000-0000-0000-0000-000000000002',
  stage: 'resolve_intent',
};

const MOUSE_PRODUCT = {
  sku: 'MOU-001', name: 'Wireless Mouse', price: 649, stock: 12, category: 'electronics',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('intentResolverNode', () => {
  it('advances to checkout stage when product is matched', async () => {
    mockGroqInvoke.mockResolvedValue({
      content: JSON.stringify({ query: 'wireless mouse', quantity: 1, confidence: 0.95 }),
    });
    mockMatchProduct.mockResolvedValue({ outcome: 'matched', product: MOUSE_PRODUCT });

    const result = await intentResolverNode(BASE_STATE);

    expect(result.stage).toBe('checkout');
    expect(result.resolvedProduct.sku).toBe('MOU-001');
    expect(result.quantity).toBe(1);
  });

  it('returns error stage when confidence is too low', async () => {
    mockGroqInvoke.mockResolvedValue({
      content: JSON.stringify({ query: 'thing', quantity: 1, confidence: 0.2 }),
    });

    const result = await intentResolverNode(BASE_STATE);

    expect(result.stage).toBe('error');
    expect(mockMatchProduct).not.toHaveBeenCalled();
  });

  it('returns error stage when catalog returns no_match', async () => {
    mockGroqInvoke.mockResolvedValue({
      content: JSON.stringify({ query: 'flying carpet', quantity: 1, confidence: 0.9 }),
    });
    mockMatchProduct.mockResolvedValue({ outcome: 'no_match', reason: 'No product matched' });

    const result = await intentResolverNode(BASE_STATE);

    expect(result.stage).toBe('error');
    expect(result.matchOutcome).toBe('no_match');
  });

  it('parses quantity correctly', async () => {
    mockGroqInvoke.mockResolvedValue({
      content: JSON.stringify({ query: 'wireless mouse', quantity: 3, confidence: 0.9 }),
    });
    mockMatchProduct.mockResolvedValue({ outcome: 'matched', product: MOUSE_PRODUCT });

    const result = await intentResolverNode(BASE_STATE);

    expect(result.quantity).toBe(3);
    expect(result.stage).toBe('checkout');
  });

  it('returns error stage when LLM throws', async () => {
    mockGroqInvoke.mockRejectedValue(new Error('LLM timeout'));

    const result = await intentResolverNode(BASE_STATE);

    expect(result.stage).toBe('error');
    expect(result.error).toMatch(/Intent parsing failed/);
  });
});
