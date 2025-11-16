import { eq, desc } from "drizzle-orm";
import { pgDb } from "../db.pg";
import { MusicGenerationTable, MusicGenerationEntity } from "../schema.pg";

export const pgMusicRepository = {
  /**
   * Save generated music to database
   */
  async saveMusicGeneration(data: {
    userId: string;
    lyrics: string;
    tags: string;
    permanentUrl?: string;
    tempUrl?: string;
    fileSize?: number;
  }): Promise<MusicGenerationEntity> {
    const [result] = await pgDb
      .insert(MusicGenerationTable)
      .values({
        userId: data.userId,
        lyrics: data.lyrics,
        tags: data.tags,
        permanentUrl: data.permanentUrl || null,
        tempUrl: data.tempUrl || null,
        fileSize: data.fileSize || null,
      })
      .returning();

    return result;
  },

  /**
   * Get all music generations for a user
   */
  async getMusicGenerationsByUserId(userId: string): Promise<MusicGenerationEntity[]> {
    return pgDb
      .select()
      .from(MusicGenerationTable)
      .where(eq(MusicGenerationTable.userId, userId))
      .orderBy(desc(MusicGenerationTable.createdAt));
  },

  /**
   * Get a single music generation by ID
   */
  async getMusicGenerationById(id: string): Promise<MusicGenerationEntity | null> {
    const [result] = await pgDb
      .select()
      .from(MusicGenerationTable)
      .where(eq(MusicGenerationTable.id, id));

    return result || null;
  },

  /**
   * Update music generation with permanent URL
   */
  async updateMusicGenerationUrl(
    id: string,
    permanentUrl: string,
  ): Promise<MusicGenerationEntity> {
    const [result] = await pgDb
      .update(MusicGenerationTable)
      .set({
        permanentUrl,
      })
      .where(eq(MusicGenerationTable.id, id))
      .returning();

    return result;
  },

  /**
   * Delete music generation
   */
  async deleteMusicGeneration(id: string): Promise<boolean> {
    const result = await pgDb
      .delete(MusicGenerationTable)
      .where(eq(MusicGenerationTable.id, id));

    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Get recent music generations for a user (limit)
   */
  async getRecentMusicGenerations(
    userId: string,
    limit: number = 20,
  ): Promise<MusicGenerationEntity[]> {
    return pgDb
      .select()
      .from(MusicGenerationTable)
      .where(eq(MusicGenerationTable.userId, userId))
      .orderBy(desc(MusicGenerationTable.createdAt))
      .limit(limit);
  },
};
