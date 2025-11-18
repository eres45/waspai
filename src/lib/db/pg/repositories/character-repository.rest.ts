/**
 * Character repository using Supabase REST API
 * Replaces direct PostgreSQL connections
 */

import { supabaseRest } from "../../supabase-rest";
import { CharacterEntity } from "../schema.pg";

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

export const characterRepository = {
  async createCharacter(input: CreateCharacterInput): Promise<CharacterEntity> {
    console.log("[Character REST] Creating character:", input.id);

    const { data, error } = await supabaseRest
      .from("Character")
      .insert({
        id: input.id,
        name: input.name,
        description: input.description,
        personality: input.personality,
        icon: input.icon,
        userId: input.userId,
        privacy: input.privacy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Character REST] createCharacter error:", error);
      throw new Error(error.message || "Failed to create character");
    }

    return data as CharacterEntity;
  },

  async getCharacterById(id: string): Promise<CharacterEntity | null> {
    console.log("[Character REST] Getting character by ID:", id);

    try {
      const { data, error } = await supabaseRest
        .from("Character")
        .select()
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      return data as CharacterEntity | null;
    } catch (error) {
      console.error("[Character REST] getCharacterById error:", error);
      return null;
    }
  },

  async getCharactersByUserId(userId: string): Promise<CharacterEntity[]> {
    console.log("[Character REST] Getting characters for user:", userId);

    try {
      const { data, error } = await supabaseRest
        .from("Character")
        .select()
        .eq("userId", userId);

      if (error) {
        throw error;
      }

      return (data as CharacterEntity[]) || [];
    } catch (error) {
      console.error("[Character REST] getCharactersByUserId error:", error);
      return [];
    }
  },

  async getPublicCharacters(): Promise<CharacterEntity[]> {
    console.log("[Character REST] Getting public characters");

    try {
      const { data, error } = await supabaseRest
        .from("Character")
        .select()
        .eq("privacy", "public");

      if (error) {
        throw error;
      }

      return (data as CharacterEntity[]) || [];
    } catch (error) {
      console.error("[Character REST] getPublicCharacters error:", error);
      return [];
    }
  },

  async getPrivateCharactersByUserId(
    userId: string,
  ): Promise<CharacterEntity[]> {
    console.log(
      "[Character REST] Getting private characters for user:",
      userId,
    );

    try {
      const { data, error } = await supabaseRest
        .from("Character")
        .select()
        .eq("userId", userId)
        .eq("privacy", "private");

      if (error) {
        throw error;
      }

      return (data as CharacterEntity[]) || [];
    } catch (error) {
      console.error(
        "[Character REST] getPrivateCharactersByUserId error:",
        error,
      );
      return [];
    }
  },

  async getPublicCharactersByUserId(
    userId: string,
  ): Promise<CharacterEntity[]> {
    console.log("[Character REST] Getting public characters for user:", userId);

    try {
      const { data, error } = await supabaseRest
        .from("Character")
        .select()
        .eq("userId", userId)
        .eq("privacy", "public");

      if (error) {
        throw error;
      }

      return (data as CharacterEntity[]) || [];
    } catch (error) {
      console.error(
        "[Character REST] getPublicCharactersByUserId error:",
        error,
      );
      return [];
    }
  },

  async updateCharacter(
    id: string,
    userId: string,
    input: UpdateCharacterInput,
  ): Promise<CharacterEntity | null> {
    console.log("[Character REST] Updating character:", id);

    try {
      const { data, error } = await supabaseRest
        .from("Character")
        .update({
          ...input,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("userId", userId)
        .select()
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as CharacterEntity | null;
    } catch (error) {
      console.error("[Character REST] updateCharacter error:", error);
      return null;
    }
  },

  async deleteCharacter(id: string, userId: string): Promise<boolean> {
    console.log("[Character REST] Deleting character:", id);

    try {
      const { error } = await supabaseRest
        .from("Character")
        .delete()
        .eq("id", id)
        .eq("userId", userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error("[Character REST] deleteCharacter error:", error);
      return false;
    }
  },

  async searchCharacters(
    query: string,
    privacy?: "public" | "private",
  ): Promise<CharacterEntity[]> {
    console.log("[Character REST] Searching characters:", query, privacy);

    try {
      let queryBuilder = supabaseRest.from("Character").select();

      // Search by name or description
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,description.ilike.%${query}%`,
      );

      if (privacy) {
        queryBuilder = queryBuilder.eq("privacy", privacy);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return (data as CharacterEntity[]) || [];
    } catch (error) {
      console.error("[Character REST] searchCharacters error:", error);
      return [];
    }
  },
};
