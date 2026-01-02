import { supabaseRest } from "../../supabase-rest";

// Using inferred type from Schema for now or defining partial match
// Since we don't have straightforward type import without Drizzle types sometimes.
// But schema.pg.ts exports MusicGenerationEntity.

export const restMusicRepository = {
  async saveMusicGeneration(data: {
    userId: string;
    lyrics: string;
    tags: string;
    permanentUrl?: string;
    tempUrl?: string;
    fileSize?: number;
  }): Promise<any> {
    // returning any effectively or MusicGenerationEntity shape
    const { data: result, error } = await supabaseRest
      .from("music_generation")
      .insert({
        user_id: data.userId,
        lyrics: data.lyrics,
        tags: data.tags,
        permanent_url: data.permanentUrl || null,
        temp_url: data.tempUrl || null,
        file_size: data.fileSize || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMusicResponse(result);
  },

  async getMusicGenerationsByUserId(userId: string): Promise<any[]> {
    const { data, error } = await supabaseRest
      .from("music_generation")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(mapMusicResponse);
  },

  async getMusicGenerationById(id: string): Promise<any | null> {
    const { data, error } = await supabaseRest
      .from("music_generation")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return mapMusicResponse(data);
  },

  async updateMusicGenerationUrl(
    id: string,
    permanentUrl: string,
  ): Promise<any> {
    const { data, error } = await supabaseRest
      .from("music_generation")
      .update({ permanent_url: permanentUrl })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapMusicResponse(data);
  },

  async deleteMusicGeneration(id: string): Promise<boolean> {
    const { error } = await supabaseRest
      .from("music_generation")
      .delete()
      .eq("id", id);

    // Supabase delete doesn't return rowCount unless we select.
    // Assuming success if no error.
    return !error;
  },

  async getRecentMusicGenerations(
    userId: string,
    limit: number = 20,
  ): Promise<any[]> {
    const { data, error } = await supabaseRest
      .from("music_generation")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(mapMusicResponse);
  },
};

function mapMusicResponse(item: any): any {
  if (!item) return item;
  return {
    id: item.id,
    userId: item.user_id,
    lyrics: item.lyrics,
    tags: item.tags,
    permanentUrl: item.permanent_url,
    tempUrl: item.temp_url,
    fileSize: item.file_size,
    createdAt: new Date(item.created_at),
  };
}
