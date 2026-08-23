import { ChatGroq } from '@langchain/groq';

/**
 * Primary LLM client using Groq with openai/gpt-oss-120b.
 * Model confirmed current at console.groq.com/docs/models (August 2026).
 */
export function createGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('[groqClient] GROQ_API_KEY is not set.');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-120b',
    temperature: 0,
    maxTokens: 512,
  });
}
