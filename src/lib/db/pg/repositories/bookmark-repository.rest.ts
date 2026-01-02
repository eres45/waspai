import { supabaseRest } from "../../supabase-rest";
// import { BookmarkRepository } from "app-types/bookmark";

// We need to match the interface from bookmark-repository.pg.ts
// which seems to import from nowhere specific but defines it inline or I missed it.
// Checking pg repo again: "export interface BookmarkRepository" is defined IN the file.
// Ideally it should be in types.
// I will export the interface from here or just match the shape.

export const restBookmarkRepository = {
  async createBookmark(
    userId: string,
    itemId: string,
    itemType: "agent" | "workflow",
  ): Promise<void> {
    const { error } = await supabaseRest.from("bookmark").upsert(
      {
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
      },
      { onConflict: "user_id, item_id, item_type" },
    );

    if (error) throw error;
  },

  async removeBookmark(
    userId: string,
    itemId: string,
    itemType: "agent" | "workflow",
  ): Promise<void> {
    const { error } = await supabaseRest
      .from("bookmark")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("item_type", itemType);

    if (error) throw error;
  },

  async toggleBookmark(
    userId: string,
    itemId: string,
    itemType: "agent" | "workflow",
    isCurrentlyBookmarked: boolean,
  ): Promise<boolean> {
    if (isCurrentlyBookmarked) {
      await this.removeBookmark(userId, itemId, itemType);
      return false;
    } else {
      await this.createBookmark(userId, itemId, itemType);
      return true;
    }
  },

  async checkItemAccess(
    itemId: string,
    itemType: "agent" | "workflow",
    userId: string,
  ): Promise<boolean> {
    if (itemType === "agent") {
      const { data: agent } = await supabaseRest
        .from("agent")
        .select("user_id, visibility")
        .eq("id", itemId)
        .single();

      if (!agent) return false;

      return (
        agent.visibility === "public" ||
        agent.visibility === "readonly" ||
        agent.user_id === userId
      );
    }

    // Workflow support TODO same as PG repo
    return false;
  },
};
