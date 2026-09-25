import { supabaseRest } from "@/lib/db/supabase-rest";
import logger from "@/lib/logger";

/**
 * Checks if a user has reached their daily limit for a specific action (web_search or image_gen).
 * Tracked by UTC calendar day.
 */
export type DailyUsageActionType = "web_search" | "image_gen" | "chat_message";

/**
 * Returns the start of the current daily usage window anchored to 4:00 AM IST (UTC+5:30).
 * 4:00 AM IST corresponds to 22:30 UTC of the preceding UTC day (+90m offset from 00:00 UTC).
 */
export function getDailyIstWindowStart(now: Date = new Date()): Date {
  const IST_4AM_OFFSET_MS = 90 * 60 * 1000; // +1h 30m shifts 04:00 AM IST to 00:00 UTC
  const shifted = new Date(now.getTime() + IST_4AM_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_4AM_OFFSET_MS);
}

export function getNextDailyIstResetTime(now: Date = new Date()): Date {
  const windowStart = getDailyIstWindowStart(now);
  return new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Checks if a user has reached their daily limit for a specific action (web_search, image_gen, or chat_message).
 * Resets daily at 4:00 AM IST.
 */
export async function checkDailyUsageLimit(
  userId: string,
  actionType: DailyUsageActionType,
  limitValue: number,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    const windowStart = getDailyIstWindowStart();

    const { data, error } = await supabaseRest
      .from("user_daily_usage")
      .select("id")
      .eq("user_id", userId)
      .eq("action_type", actionType)
      .gte("created_at", windowStart.toISOString());

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
  actionType: DailyUsageActionType,
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
