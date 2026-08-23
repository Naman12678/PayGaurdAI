import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

/**
 * Fallback LLM client using Google Gemini.
 * Used when the primary Groq client throws an error.
 * Model: gemini-2.0-flash — fast, cheap, large context.
 */
export function createFallbackClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('[fallbackClient] GEMINI_API_KEY is not set.');
  }
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash',
    temperature: 0,
    maxOutputTokens: 512,
  });
}

/**
 * Calls primaryFn first; on any error falls back to fallbackFn.
 * A timeout of 15 s is applied to each attempt so a hung LLM call
 * doesn't stall the checkout flow indefinitely.
 *
 * @param {() => Promise<any>} primaryFn
 * @param {() => Promise<any>} fallbackFn
 */
export async function withFallback(primaryFn, fallbackFn) {
  const timeout = (ms, label) =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms (${label})`)), ms)
    );

  try {
    return await Promise.race([primaryFn(), timeout(15000, 'groq')]);
  } catch (primaryErr) {
    console.warn(`[llm] Primary (Groq) failed: ${primaryErr.message}. Trying Gemini fallback...`);
    return await Promise.race([fallbackFn(), timeout(15000, 'gemini')]);
  }
}
