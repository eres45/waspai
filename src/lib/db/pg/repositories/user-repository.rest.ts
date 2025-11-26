import { supabaseRest } from "../../supabase-rest";
import logger from "@/lib/logger";

export const userRepositoryRest = {
  /**
   * Create or upsert a user in the database
   * This ensures the user exists in the public.user table for foreign key constraints
   */
  async createOrUpdateUser(
    userId: string,
    email: string,
    name?: string,
    avatarUrl?: string | null,
  ) {
    try {
      logger.info(`[User REST] Creating/updating user: ${userId}`);

      const userData: Record<string, unknown> = {
        id: userId,
        email,
        name: name || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only include image if avatarUrl is provided
      if (avatarUrl) {
        userData.image = avatarUrl;
      }

      const { data, error } = await supabaseRest
        .from("user")
        .upsert(userData, {
          onConflict: "id",
        })
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error creating/updating user:`, error);
        throw error;
      }

      logger.info(`[User REST] User created/updated successfully: ${userId}`);
      return data;
    } catch (error) {
      logger.error(`[User REST] createOrUpdateUser error:`, error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabaseRest
        .from("user")
        .select()
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data || null;
    } catch (error) {
      logger.error(`[User REST] getUserById error:`, error);
      return null;
    }
  },

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseRest
        .from("user")
        .select("id")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error(`[User REST] userExists error:`, error);
      return false;
    }
  },

  /**
   * Update user details (name, email, image)
   */
  async updateUserDetails({
    userId,
    name,
    email,
    image,
  }: {
    userId: string;
    name?: string;
    email?: string;
    image?: string;
  }) {
    try {
      logger.info(
        `[User REST] Updating user: ${userId}, name=${name}, email=${email}, image=${image ? "yes" : "no"}`,
      );

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (image !== undefined) updateData.image = image;

      const { data, error } = await supabaseRest
        .from("user")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error updating user:`, error);
        throw error;
      }

      logger.info(`[User REST] User updated successfully: ${userId}`);
      return data;
    } catch (error) {
      logger.error(`[User REST] updateUserDetails error:`, error);
      throw error;
    }
  },

  /**
   * Update user preferences (settings)
   */
  async updateUserPreferences(
    userId: string,
    preferences: Record<string, unknown>,
  ) {
    try {
      logger.info(`[User REST] Updating preferences for user: ${userId}`);

      const { data, error } = await supabaseRest
        .from("user")
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error updating preferences:`, error);
        throw error;
      }

      logger.info(`[User REST] Preferences updated successfully: ${userId}`);
      return data;
    } catch (error) {
      logger.error(`[User REST] updateUserPreferences error:`, error);
      throw error;
    }
  },
};
