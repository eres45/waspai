import { pgDb as db } from "../db.pg";
import { CharacterTable, CharacterEntity } from "../schema.pg";
import { eq, and, or } from "drizzle-orm";

interface CreateCharacterInput {
  id: string;
  name: string;
  description: string;
  personality: string;
  icon?: {
    type?: string;
    value: string;
    style?: {
      backgroundColor: string;
    };
  };
  userId: string;
  privacy: "public" | "private";
}

interface UpdateCharacterInput {
  name?: string;
  description?: string;
  personality?: string;
  icon?: {
    type?: string;
    value: string;
    style?: {
      backgroundColor: string;
    };
  };
  privacy?: "public" | "private";
}

export const pgCharacterRepository = {
  async createCharacter(input: CreateCharacterInput): Promise<CharacterEntity> {
    const [character] = await db
      .insert(CharacterTable)
      .values({
        id: input.id,
        name: input.name,
        description: input.description,
        personality: input.personality,
        icon: input.icon,
        userId: input.userId,
        privacy: input.privacy,
      })
      .returning();

    return character;
  },

  async getCharacterById(id: string): Promise<CharacterEntity | null> {
    const [character] = await db
      .select()
      .from(CharacterTable)
      .where(eq(CharacterTable.id, id));

    return character || null;
  },

  async getCharactersByUserId(userId: string): Promise<CharacterEntity[]> {
    return await db
      .select()
      .from(CharacterTable)
      .where(eq(CharacterTable.userId, userId));
  },

  async getPublicCharacters(): Promise<CharacterEntity[]> {
    return await db
      .select()
      .from(CharacterTable)
      .where(eq(CharacterTable.privacy, "public"));
  },

  async getPrivateCharactersByUserId(userId: string): Promise<CharacterEntity[]> {
    return await db
      .select()
      .from(CharacterTable)
      .where(
        and(
          eq(CharacterTable.userId, userId),
          eq(CharacterTable.privacy, "private"),
        ),
      );
  },

  async getPublicCharactersByUserId(userId: string): Promise<CharacterEntity[]> {
    return await db
      .select()
      .from(CharacterTable)
      .where(
        and(
          eq(CharacterTable.userId, userId),
          eq(CharacterTable.privacy, "public"),
        ),
      );
  },

  async updateCharacter(
    id: string,
    userId: string,
    input: UpdateCharacterInput,
  ): Promise<CharacterEntity | null> {
    const [character] = await db
      .update(CharacterTable)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(eq(CharacterTable.id, id), eq(CharacterTable.userId, userId)),
      )
      .returning();

    return character || null;
  },

  async deleteCharacter(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(CharacterTable)
      .where(
        and(eq(CharacterTable.id, id), eq(CharacterTable.userId, userId)),
      );

    return (result.rowCount ?? 0) > 0;
  },

  async searchCharacters(
    query: string,
    privacy?: "public" | "private",
  ): Promise<CharacterEntity[]> {
    let whereClause;

    if (privacy) {
      whereClause = and(
        or(
          eq(CharacterTable.name, query),
          eq(CharacterTable.description, query),
        ),
        eq(CharacterTable.privacy, privacy),
      );
    } else {
      whereClause = or(
        eq(CharacterTable.name, query),
        eq(CharacterTable.description, query),
      );
    }

    return await db
      .select()
      .from(CharacterTable)
      .where(whereClause);
  },
};
