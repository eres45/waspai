/**
 * Archive repository using Supabase REST API
 */

import {
  Archive,
  ArchiveItem,
  ArchiveRepository,
  ArchiveWithItemCount,
} from "app-types/archive";
import { supabaseRest } from "../../supabase-rest";
import { generateUUID } from "lib/utils";

export const archiveRepository: ArchiveRepository = {
  async createArchive(archive) {
    console.log("[Archive REST] Creating archive:", archive.name);

    const { data, error } = await supabaseRest
      .from("archive")
      .insert({
        id: generateUUID(),
        name: archive.name,
        description: archive.description,
        userId: archive.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Archive REST] createArchive error:", error);
      throw new Error(error.message || "Failed to create archive");
    }

    return data as Archive;
  },

  async getArchivesByUserId(userId) {
    console.log("[Archive REST] Getting archives for user:", userId);

    try {
      const { data: archives, error: archivesError } = await supabaseRest
        .from("archive")
        .select()
        .eq("userId", userId)
        .order("updatedAt", { ascending: false });

      if (archivesError) {
        throw archivesError;
      }

      // Get item counts for each archive
      const result = await Promise.all(
        (archives || []).map(async (archive) => {
          const { count, error: countError } = await supabaseRest
            .from("archive_item")
            .select("*", { count: "exact", head: true })
            .eq("archiveId", archive.id);

          if (countError) {
            console.error("[Archive REST] Error counting items:", countError);
            return {
              ...archive,
              itemCount: 0,
            };
          }

          return {
            ...archive,
            itemCount: count || 0,
          };
        }),
      );

      return result as ArchiveWithItemCount[];
    } catch (error) {
      console.error("[Archive REST] getArchivesByUserId error:", error);
      return [];
    }
  },

  async getArchiveById(id) {
    console.log("[Archive REST] Getting archive by ID:", id);

    try {
      const { data, error } = await supabaseRest
        .from("archive")
        .select()
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as Archive | null;
    } catch (error) {
      console.error("[Archive REST] getArchiveById error:", error);
      return null;
    }
  },

  async updateArchive(id, archive) {
    console.log("[Archive REST] Updating archive:", id);

    try {
      const { data, error } = await supabaseRest
        .from("archive")
        .update({
          name: archive.name,
          description: archive.description,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as Archive;
    } catch (error) {
      console.error("[Archive REST] updateArchive error:", error);
      throw error;
    }
  },

  async deleteArchive(id) {
    console.log("[Archive REST] Deleting archive:", id);

    try {
      // Delete items first
      const { error: itemsError } = await supabaseRest
        .from("archive_item")
        .delete()
        .eq("archiveId", id);

      if (itemsError) {
        throw itemsError;
      }

      // Delete archive
      const { error: archiveError } = await supabaseRest
        .from("archive")
        .delete()
        .eq("id", id);

      if (archiveError) {
        throw archiveError;
      }
    } catch (error) {
      console.error("[Archive REST] deleteArchive error:", error);
      throw error;
    }
  },

  async addItemToArchive(archiveId, itemId, userId) {
    console.log("[Archive REST] Adding item to archive:", archiveId, itemId);

    try {
      const { data, error } = await supabaseRest
        .from("archive_item")
        .insert({
          id: generateUUID(),
          archiveId,
          itemId,
          userId,
          addedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error && !error.message?.includes("duplicate")) {
        throw error;
      }

      return data as ArchiveItem;
    } catch (error) {
      console.error("[Archive REST] addItemToArchive error:", error);
      throw error;
    }
  },

  async removeItemFromArchive(archiveId, itemId) {
    console.log(
      "[Archive REST] Removing item from archive:",
      archiveId,
      itemId,
    );

    try {
      const { error } = await supabaseRest
        .from("archive_item")
        .delete()
        .eq("archiveId", archiveId)
        .eq("itemId", itemId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("[Archive REST] removeItemFromArchive error:", error);
      throw error;
    }
  },

  async getArchiveItems(archiveId) {
    console.log("[Archive REST] Getting items for archive:", archiveId);

    try {
      const { data, error } = await supabaseRest
        .from("archive_item")
        .select()
        .eq("archiveId", archiveId)
        .order("addedAt", { ascending: true });

      if (error) {
        throw error;
      }

      return (data as ArchiveItem[]) || [];
    } catch (error) {
      console.error("[Archive REST] getArchiveItems error:", error);
      return [];
    }
  },

  async getItemArchives(itemId, userId) {
    console.log("[Archive REST] Getting archives for item:", itemId);

    try {
      const { data, error } = await supabaseRest
        .from("archive_item")
        .select(
          `
          archiveId,
          Archive:archiveId (
            id,
            name,
            description,
            userId,
            createdAt,
            updatedAt
          )
        `,
        )
        .eq("itemId", itemId);

      if (error) {
        throw error;
      }

      // Filter by userId and extract archives
      const archives = (data || [])
        .map((item: any) => item.Archive)
        .filter((archive: any) => archive && archive.userId === userId);

      return archives as Archive[];
    } catch (error) {
      console.error("[Archive REST] getItemArchives error:", error);
      return [];
    }
  },
};
