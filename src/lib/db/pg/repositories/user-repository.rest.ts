import { supabaseRest } from "../../supabase-rest";
import logger from "@/lib/logger";
import { UserRepository, UserPreferences, User } from "app-types/user";
import crypto from "crypto";

const mapUserToEntity = (data: any): any => {
  if (!data) return null;
  const { password, ...rest } = data;
  return {
    ...rest,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    preferences: data.preferences as UserPreferences,
    welcomeEmailSent: data.welcome_email_sent,
    tier: data.tier,
    referralCode: data.referral_code,
    referredBy: data.referred_by,
    referralCount: data.referral_count,
    referralRewardClaimed: data.referral_reward_claimed,
    referralWidgetHidden: data.referral_widget_hidden,
    tierExpiresAt: data.tier_expires_at ? new Date(data.tier_expires_at) : null,
    lastSignInIp: data.last_sign_in_ip,
  };
};

export const userRepositoryRest: UserRepository = {
  async createOrUpdateUser(
    userId: string,
    email: string,
    name?: string,
    avatarUrl?: string | null,
  ) {
    try {
      // Check existing user data first to avoid overwriting custom changes
      const { data: existingUser } = await supabaseRest
        .from("user")
        .select("name, image")
        .eq("id", userId)
        .single();

      const userData: Record<string, unknown> = {
        id: userId,
        email,
        updated_at: new Date().toISOString(),
      };

      // Only set created_at if it's a new user (handled by upsert usually, but good for payload correctness)
      // Actually, we don't need to send created_at on update, but upsert handles it.

      // LOGIC: Overwrite name/image ONLY if:
      // 1. User is new (existingUser is null)
      // 2. Existing name is "Synced User" (placeholder fix)
      // 3. Existing name/image is missing/empty

      const isPlaceholder = existingUser?.name === "Synced User";
      const hasName = !!existingUser?.name;
      const hasImage = !!existingUser?.image;

      if (!existingUser || isPlaceholder || !hasName) {
        userData.name = name || "";
      }

      if (!existingUser || !hasImage) {
        if (avatarUrl) {
          userData.image = avatarUrl;
        }
      }

      // If it's a completely new user, set created_at and referral_code
      if (!existingUser) {
        userData.created_at = new Date().toISOString();
        userData.referral_code = crypto.randomUUID();
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

      return mapUserToEntity(data);
    } catch (error) {
      logger.error(`[User REST] createOrUpdateUser error:`, error);
      throw error;
    }
  },

  async existsByEmail(email: string) {
    try {
      const { data, error } = await supabaseRest
        .from("user")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        logger.error("Error checking if email exists:", error);
        return false;
      }
      return !!data;
    } catch (error) {
      logger.error("Error in existsByEmail:", error);
      return false;
    }
  },

  async getUserById(userId: string) {
    try {
      // Fetch user and session info
      const { data, error } = await supabaseRest
        .from("user")
        .select("*, session(updated_at)")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data) return null;

      // Calculate lastLogin
      let lastLogin: Date | null = null;
      if (data.session && Array.isArray(data.session)) {
        const sessions = data.session;
        if (sessions.length > 0) {
          const sorted = sessions.sort(
            (a: any, b: any) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          );
          lastLogin = new Date(sorted[0].updated_at);
        }
      }

      return {
        ...mapUserToEntity(data),
        lastLogin,
      };
    } catch (error) {
      logger.error(`[User REST] getUserById error:`, error);
      return null;
    }
  },

  async userExists(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabaseRest
        .from("user")
        .select("id", { count: "exact", head: true })
        .eq("id", userId);

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return (count ?? 0) > 0;
    } catch (error) {
      logger.error(`[User REST] userExists error:`, error);
      return false;
    }
  },

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
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (image !== undefined) updateData.image = image;

      // 1. Fetch existing user
      const { data: existingUser, error: fetchError } = await supabaseRest
        .from("user")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError || !existingUser) {
        logger.error(
          `[User REST] Failed to fetch user for update:`,
          fetchError,
        );
        throw fetchError || new Error("User not found");
      }

      // 2. Merge
      const mergedUser = { ...existingUser, ...updateData };

      // 3. Upsert
      const { data, error } = await supabaseRest
        .from("user")
        .upsert(mergedUser, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error updating user:`, error);
        throw error;
      }

      return mapUserToEntity(data);
    } catch (error) {
      logger.error(`[User REST] updateUserDetails error:`, error);
      throw error;
    }
  },

  async updatePreferences(userId: string, preferences: UserPreferences) {
    try {
      // 1. Fetch existing user
      const { data: existingUser, error: fetchError } = await supabaseRest
        .from("user")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError || !existingUser) {
        logger.error(
          `[User REST] Failed to fetch user for preferences update:`,
          fetchError,
        );
        throw fetchError || new Error("User not found");
      }

      // 2. Merge and Upsert
      const { data, error } = await supabaseRest
        .from("user")
        .upsert(
          {
            ...existingUser,
            preferences,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error updating preferences:`, error);
        throw error;
      }

      // Return User
      return mapUserToEntity(data);
    } catch (error) {
      logger.error(`[User REST] updateUserPreferences error:`, error);
      throw error;
    }
  },

  async getPreferences(userId: string) {
    const { data, error } = await supabaseRest
      .from("user")
      .select("preferences")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data.preferences;
  },

  async getUserCount() {
    const { count, error } = await supabaseRest
      .from("user")
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count || 0;
  },

  async getUserAuthMethods(userId: string) {
    const { data, error } = await supabaseRest
      .from("account")
      .select("provider_id")
      .eq("user_id", userId);

    if (error) return { hasPassword: false, oauthProviders: [] };

    const providers = data.map((a: any) => a.provider_id);
    return {
      hasPassword: providers.includes("credential"),
      oauthProviders: providers.filter((p: string) => p !== "credential"),
    };
  },

  async getUserStats(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoDate = thirtyDaysAgo.toISOString();

    const { count: threadCount } = await supabaseRest
      .from("chat_thread")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", isoDate);

    const { data: threads } = await supabaseRest
      .from("chat_thread")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", isoDate);

    const threadIds = threads?.map((t: any) => t.id) || [];

    let messageCount = 0;
    const modelStatsMap = new Map<string, { count: number; tokens: number }>();

    if (threadIds.length > 0) {
      const { data: messages } = await supabaseRest
        .from("chat_message")
        .select("id, metadata, created_at")
        .in("thread_id", threadIds)
        .gte("created_at", isoDate);

      if (messages) {
        messageCount = messages.length;
        for (const msg of messages) {
          const meta = msg.metadata as any;
          if (meta?.chatModel?.model) {
            const model = meta.chatModel.model;
            const tokens = Number(meta.usage?.totalTokens || 0);

            const existing = modelStatsMap.get(model) || {
              count: 0,
              tokens: 0,
            };
            existing.count++;
            existing.tokens += tokens;
            modelStatsMap.set(model, existing);
          }
        }
      }
    }

    const modelStats = Array.from(modelStatsMap.entries())
      .map(([model, stats]) => ({
        model,
        messageCount: stats.count,
        totalTokens: stats.tokens,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 10);

    const totalTokens = modelStats.reduce(
      (acc, curr) => acc + curr.totalTokens,
      0,
    );

    return {
      threadCount: threadCount || 0,
      messageCount,
      modelStats,
      totalTokens,
      period: "Last 30 Days",
    };
  },

  async setWelcomeEmailSent(userId: string, sent: boolean) {
    try {
      const { data, error } = await supabaseRest
        .from("user")
        .update({
          welcome_email_sent: sent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error setting welcomeEmailSent:`, error);
        throw error;
      }

      return mapUserToEntity(data);
    } catch (error) {
      logger.error(`[User REST] setWelcomeEmailSent error:`, error);
      throw error;
    }
  },

  async getUserByReferralCode(referralCode: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseRest
        .from("user")
        .select()
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (error) {
        logger.error(`[User REST] Error getting user by referral code:`, error);
        return null;
      }

      return mapUserToEntity(data);
    } catch (error) {
      logger.error(`[User REST] getUserByReferralCode error:`, error);
      throw error;
    }
  },

  async updateReferralInfo(
    userId: string,
    data: Partial<{
      referralCode: string;
      referredBy: string | null;
      referralCount: number;
      referralRewardClaimed: string;
      referralWidgetHidden: boolean;
      tier: string;
      tierExpiresAt: Date | null;
      lastSignInIp: string | null;
    }>,
  ): Promise<User> {
    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (data.referralCode !== undefined)
        payload.referral_code = data.referralCode;
      if (data.referredBy !== undefined) payload.referred_by = data.referredBy;
      if (data.referralCount !== undefined)
        payload.referral_count = data.referralCount;
      if (data.referralRewardClaimed !== undefined)
        payload.referral_reward_claimed = data.referralRewardClaimed;
      if (data.referralWidgetHidden !== undefined)
        payload.referral_widget_hidden = data.referralWidgetHidden;
      if (data.tier !== undefined) payload.tier = data.tier;
      if (data.tierExpiresAt !== undefined) {
        payload.tier_expires_at = data.tierExpiresAt
          ? data.tierExpiresAt.toISOString()
          : null;
      }
      if (data.lastSignInIp !== undefined)
        payload.last_sign_in_ip = data.lastSignInIp;

      const { data: updated, error } = await supabaseRest
        .from("user")
        .update(payload)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logger.error(`[User REST] Error updating referral info:`, error);
        throw error;
      }

      return mapUserToEntity(updated);
    } catch (error) {
      logger.error(`[User REST] updateReferralInfo error:`, error);
      throw error;
    }
  },
};
