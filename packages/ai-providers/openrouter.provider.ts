import OpenAI from 'openai';
import { ILlmProvider } from './provider.interface';
import { LLMConfig, LLMResponse, Message } from './types';

export class OpenRouterProvider implements ILlmProvider {
  name = 'openrouter';
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error(
        'OPENROUTER_API_KEY is missing. Please configure it in your environment variables to use OpenRouter.',
      );
    }
    this.client = new OpenAI({
      apiKey: key,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'useAxiom',
      },
    });
  }

  async generateResponse(messages: Message[], config?: LLMConfig): Promise<LLMResponse> {
    const tools = config?.tools?.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: config?.model || 'openai/gpt-4o',
      messages: messages as any,
      temperature: config?.temperature,
      max_tokens: config?.maxTokens,
      top_p: config?.topP,
      tools: tools && tools.length > 0 ? tools : undefined,
    });

    const choice = response.choices[0]?.message;
    return {
      content: choice?.content || '',
      toolCalls: choice?.tool_calls?.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      raw: response,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async generateStructuredResponse<T>(
    messages: Message[],
    schema: any,
    config?: LLMConfig,
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: config?.model || 'openai/gpt-4o',
      messages: messages as any,
      temperature: config?.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_response',
          strict: true,
          schema: schema,
        },
      } as any,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned an empty or invalid structured content completion.');
    }

    return JSON.parse(content) as T;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error(
      'Embeddings are not supported by the default OpenRouter provider in useAxiom yet.',
    );
  }
}
