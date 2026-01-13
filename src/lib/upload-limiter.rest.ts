import { supabaseRest } from "@/lib/db/supabase-rest";
import logger from "@/lib/logger";
import { UPLOAD_LIMITS, USER_ROLES } from "@/types/roles";

/**
 * Check if user has reached daily upload limit (REST API version)
 */
export async function checkDailyUploadLimitRest(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: Date;
}> {
  try {
    // 1. Fetch user role
    const { data: userData, error: userError } = await supabaseRest
      .from("user")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      logger.error("Error fetching user role for limit:", userError);
    }

    const role = (userData as any)?.role || USER_ROLES.USER;
    const limit =
      UPLOAD_LIMITS[role as keyof typeof UPLOAD_LIMITS] || UPLOAD_LIMITS.user;

    // 2. Get today's start time (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 3. Query to count uploads today
    const { data, error } = await supabaseRest
      .from("file_uploads")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    if (error) {
      logger.error("Error checking upload limit:", error);
      // On error, allow upload (fail open)
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetTime: getResetTime(),
      };
    }

    const uploadCount = data?.length || 0;
    const remaining = Math.max(0, limit - uploadCount);

    return {
      allowed: remaining > 0,
      remaining,
      limit,
      resetTime: getResetTime(),
    };
  } catch (error) {
    logger.error("Error in checkDailyUploadLimitRest:", error);
    const fallbackLimit = UPLOAD_LIMITS.user;
    // On error, allow upload (fail open)
    return {
      allowed: true,
      remaining: fallbackLimit,
      limit: fallbackLimit,
      resetTime: getResetTime(),
    };
  }
}

/**
 * Record an upload for a user (REST API version)
 */
export async function recordUploadRest(
  userId: string,
  filename: string,
  fileSize: number,
  fileType: string,
  uploadUrl: string,
): Promise<void> {
  try {
    const { error } = await supabaseRest.from("file_uploads").insert({
      user_id: userId,
      filename,
      file_size: fileSize,
      file_type: fileType,
      upload_url: uploadUrl,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("Error recording upload:", error);
      // Don't throw - recording upload is not critical
    }
  } catch (error) {
    logger.error("Error in recordUploadRest:", error);
    // Don't throw - recording upload is not critical
  }
}

/**
 * Get user's upload history for today (REST API version)
 */
export async function getTodayUploadsRest(userId: string): Promise<
  Array<{
    filename: string;
    fileSize: number;
    fileType: string;
    uploadUrl: string;
    createdAt: Date;
  }>
> {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabaseRest
      .from("file_uploads")
      .select()
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting today uploads:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      filename: row.filename,
      fileSize: row.file_size,
      fileType: row.file_type,
      uploadUrl: row.upload_url,
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    logger.error("Error in getTodayUploadsRest:", error);
    return [];
  }
}

/**
 * Helper function to calculate reset time
 */
function getResetTime(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const resetTime = new Date(today);
  resetTime.setUTCDate(resetTime.getUTCDate() + 1);
  return resetTime;
}
