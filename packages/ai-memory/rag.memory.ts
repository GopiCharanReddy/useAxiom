import { IAiMemory, IMemoryMessage } from './memory.interface';
import { ILlmProvider } from '@useaxiom/ai-providers';
import { prisma } from '@useaxiom/database';

export class RagMemory implements IAiMemory {
  constructor(private provider: ILlmProvider) {}

  async getShortTermContext(threadId: string): Promise<IMemoryMessage[]> {
    const messages = await prisma.shortTermMemory.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.createdAt,
    }));
  }

  async appendShortTermMessage(threadId: string, message: IMemoryMessage): Promise<void> {
    await prisma.shortTermMemory.create({
      data: {
        threadId,
        role: message.role,
        content: message.content,
        createdAt: message.timestamp,
      },
    });
  }

  async getLongTermContext(query: string, limit: number = 5): Promise<string[]> {
    const embedding = await this.provider.generateEmbedding(query);

    const embeddingStr = `[${embedding.join(',')}]`;

    const results = await prisma.$queryRaw<any[]>`
      SELECT value
      FROM "LongTermMemory"
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return results.map((r: any) => r.value);
  }

  async appendLongTermMemory(key: string, value: string, tags?: string[]): Promise<void> {
    const embedding = await this.provider.generateEmbedding(value);
    const embeddingStr = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "LongTermMemory" (id, key, value, tags, embedding, "createdAt")
      VALUES (
        gen_random_uuid(), 
        ${key}, 
        ${value}, 
        ARRAY[${(tags || []).join(',')}]::text[], 
        ${embeddingStr}::vector, 
        NOW()
      )
    `;
  }

  async clearContext(threadId: string): Promise<void> {
    await prisma.shortTermMemory.deleteMany({
      where: { threadId },
    });
  }
}
