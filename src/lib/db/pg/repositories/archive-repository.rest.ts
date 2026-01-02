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

const mapArchiveToEntity = (data: any): Archive => ({
  id: data.id,
  name: data.name,
  description: data.description,
  userId: data.user_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapArchiveItemToEntity = (data: any): ArchiveItem => ({
  id: data.id,
  archiveId: data.archive_id,
  itemId: data.item_id,
  userId: data.user_id,
  addedAt: data.added_at,
});

export const archiveRepository: ArchiveRepository = {
  async createArchive(archive) {
    console.log("[Archive REST] Creating archive:", archive.name);

    const { data, error } = await supabaseRest
      .from("archive")
      .insert({
        id: generateUUID(),
        name: archive.name,
        description: archive.description,
        user_id: archive.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Archive REST] createArchive error:", error);
      throw new Error(error.message || "Failed to create archive");
    }

    return mapArchiveToEntity(data);
  },

  async getArchivesByUserId(userId) {
    console.log("[Archive REST] Getting archives for user:", userId);

    try {
      const { data: archives, error: archivesError } = await supabaseRest
        .from("archive")
        .select()
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (archivesError) {
        throw archivesError;
      }

      // Get item counts for each archive
      const result = await Promise.all(
        (archives || []).map(async (archive) => {
          const { count, error: countError } = await supabaseRest
            .from("archive_item")
            .select("*", { count: "exact", head: true })
            .eq("archive_id", archive.id);

          if (countError) {
            console.error("[Archive REST] Error counting items:", countError);
            return {
              ...archive,
              item_count: 0,
            };
          }

          return {
            ...archive,
            item_count: count || 0,
          };
        }),
      );

      return result.map((a) => ({
        ...mapArchiveToEntity(a),
        itemCount: (a as any).item_count,
      })) as ArchiveWithItemCount[];
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

      return data ? mapArchiveToEntity(data) : null;
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return mapArchiveToEntity(data);
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
        .eq("archive_id", id);

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
          archive_id: archiveId,
          item_id: itemId,
          user_id: userId,
          added_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error && !error.message?.includes("duplicate")) {
        throw error;
      }

      return mapArchiveItemToEntity(data);
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
        .eq("archive_id", archiveId)
        .eq("item_id", itemId);

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
        .eq("archive_id", archiveId)
        .order("added_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data as any[])?.map(mapArchiveItemToEntity) || [];
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
          archive_id,
          Archive:archive_id (
            id,
            name,
            description,
            user_id,
            created_at,
            updated_at
          )
        `,
        )
        .eq("item_id", itemId);

      if (error) {
        throw error;
      }

      // Filter by userId and extract archives
      const archives = (data || [])
        .map((item: any) => item.Archive)
        .filter((archive: any) => archive && archive.user_id === userId)
        .map(mapArchiveToEntity);

      return archives;
    } catch (error) {
      console.error("[Archive REST] getItemArchives error:", error);
      return [];
    }
  },
};
