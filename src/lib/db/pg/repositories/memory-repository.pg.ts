import { eq, desc, and, ilike } from "drizzle-orm";
import { pgDb } from "../db.pg";
import { UserMemoryTable } from "../schema.pg";

export const memoryRepository = {
  async create(userId: string, content: string, tags: string[] = []) {
    const [memory] = await pgDb
      .insert(UserMemoryTable)
      .values({
        userId,
        content,
        tags,
      })
      .returning();
    return memory;
  },

  async list(userId: string, limit = 50) {
    return await pgDb
      .select()
      .from(UserMemoryTable)
      .where(eq(UserMemoryTable.userId, userId))
      .orderBy(desc(UserMemoryTable.createdAt))
      .limit(limit);
  },

  async search(userId: string, query: string) {
    // Simple ILIKE search for now
    return await pgDb
      .select()
      .from(UserMemoryTable)
      .where(
        and(
          eq(UserMemoryTable.userId, userId),
          ilike(UserMemoryTable.content, `%${query}%`),
        ),
      )
      .orderBy(desc(UserMemoryTable.createdAt))
      .limit(20);
  },

  async delete(userId: string, id: string) {
    return await pgDb
      .delete(UserMemoryTable)
      .where(
        and(eq(UserMemoryTable.id, id), eq(UserMemoryTable.userId, userId)),
      )
      .returning();
  },
};
