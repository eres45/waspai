import { supabaseRest } from "@/lib/db/supabase-rest";
import logger from "@/lib/logger";

/**
 * Checks if a user has reached their daily limit for a specific action (web_search or image_gen).
 * Tracked by UTC calendar day.
 */
export async function checkDailyUsageLimit(
  userId: string,
  actionType: "web_search" | "image_gen",
  limitValue: number,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabaseRest
      .from("user_daily_usage")
      .select("id")
      .eq("user_id", userId)
      .eq("action_type", actionType)
      .gte("created_at", today.toISOString());

    if (error) {
      logger.error(`Error checking daily limit for ${actionType}:`, error);
      // On database check failure, fail open to avoid blocking users
      return {
        allowed: true,
        count: 0,
        limit: limitValue,
      };
    }

    const count = data?.length || 0;
    return {
      allowed: count < limitValue,
      count,
      limit: limitValue,
    };
  } catch (error) {
    logger.error(`Exception checking daily limit for ${actionType}:`, error);
    return {
      allowed: true,
      count: 0,
      limit: limitValue,
    };
  }
}

/**
 * Records a usage event in the database.
 */
export async function recordDailyUsage(
  userId: string,
  actionType: "web_search" | "image_gen",
): Promise<void> {
  try {
    const { error } = await supabaseRest.from("user_daily_usage").insert({
      user_id: userId,
      action_type: actionType,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error(`Error recording daily usage for ${actionType}:`, error);
    }
  } catch (error) {
    logger.error(`Exception recording daily usage for ${actionType}:`, error);
  }
}
