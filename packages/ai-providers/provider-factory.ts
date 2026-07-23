import { ILlmProvider } from './provider.interface';
import { OpenAiProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { MockLlmProvider } from './mock.provider';

export function getLlmProvider(): ILlmProvider {
  const path = require('path');
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env'), override: true });
  require('dotenv').config({ path: path.resolve(process.cwd(), '../../.env'), override: true });
  const providerName = process.env.LLM_PROVIDER?.toLowerCase();

  if (providerName === 'openai') {
    return new OpenAiProvider();
  }

  if (providerName === 'gemini') {
    return new GeminiProvider();
  }

  if (providerName === 'openrouter') {
    return new OpenRouterProvider();
  }

  console.warn(
    'No LLM_PROVIDER specified, falling back to MockLlmProvider. Set LLM_PROVIDER=gemini or openai in env to use real integrations.',
  );
  return new MockLlmProvider();
}
