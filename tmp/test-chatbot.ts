import { MockLlmProvider } from '../packages/ai-providers/mock.provider';

async function main() {
  const provider = new MockLlmProvider();
  console.log('--- PROVIDER NAME ---');
  console.log(provider.name);

  const queries = [
    "What can you do?",
    "Show all ongoing projects",
    "Give me details about the Website project",
    "Tell me about Dave",
    "What is blocked on Dave?",
    "Which tasks are blocked?",
    "Show team workloads",
    "Who has the highest workload?",
    "Which tasks are completed?",
    "Who is working on the Website Redesign project?",
    "Tell me about a random non-existent something"
  ];

  for (const q of queries) {
    console.log(`\n\n==================================================`);
    console.log(`QUERY: "${q}"`);
    console.log(`==================================================`);
    try {
      const response = await provider.generateStructuredResponse(
        [
          { role: 'user', content: q }
        ],
        {
          type: 'object',
          properties: {
            intent: { type: 'string' }
          }
        }
      );
      console.log(response.reply);
    } catch (err) {
      console.error(err);
    }
  }
}

main();
