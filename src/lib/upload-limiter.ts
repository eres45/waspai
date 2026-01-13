import { pgDb } from "lib/db/pg/db.pg";
import { eq, sql } from "drizzle-orm";
import { UserTable } from "lib/db/pg/schema.pg";
import { UPLOAD_LIMITS, USER_ROLES } from "@/types/roles";

/**
 * Check if user has reached daily upload limit
 */
export async function checkDailyUploadLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: Date;
}> {
  // Fetch user role
  const [user] = await pgDb
    .select({ role: UserTable.role })
    .from(UserTable)
    .where(eq(UserTable.id, userId));

  const role = user?.role || USER_ROLES.USER;
  const limit =
    UPLOAD_LIMITS[role as keyof typeof UPLOAD_LIMITS] || UPLOAD_LIMITS.user;

  // Get today's start time (UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Query to count uploads today
  const result = await pgDb.execute(
    sql`
      SELECT COUNT(*) as count
      FROM file_uploads
      WHERE user_id = ${userId}
        AND created_at >= ${today}
    `,
  );

  const uploadCount = Number(result.rows?.[0]?.count) || 0;
  const remaining = Math.max(0, limit - uploadCount);

  // Calculate reset time (next day at 00:00 UTC)
  const resetTime = new Date(today);
  resetTime.setUTCDate(resetTime.getUTCDate() + 1);

  return {
    allowed: remaining > 0,
    remaining,
    limit,
    resetTime,
  };
}

/**
 * Record an upload for a user
 */
export async function recordUpload(
  userId: string,
  filename: string,
  fileSize: number,
  fileType: string,
  uploadUrl: string,
): Promise<void> {
  await pgDb.execute(
    sql`
      INSERT INTO file_uploads (user_id, filename, file_size, file_type, upload_url, created_at)
      VALUES (${userId}, ${filename}, ${fileSize}, ${fileType}, ${uploadUrl}, NOW())
    `,
  );
}

/**
 * Get user's upload history for today
 */
export async function getTodayUploads(userId: string): Promise<
  Array<{
    filename: string;
    fileSize: number;
    fileType: string;
    uploadUrl: string;
    createdAt: Date;
  }>
> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const result = await pgDb.execute(
    sql`
      SELECT filename, file_size, file_type, upload_url, created_at
      FROM file_uploads
      WHERE user_id = ${userId}
        AND created_at >= ${today}
      ORDER BY created_at DESC
    `,
  );

  return (result.rows || []).map((row: any) => ({
    filename: row.filename,
    fileSize: row.file_size,
    fileType: row.file_type,
    uploadUrl: row.upload_url,
    createdAt: new Date(row.created_at),
  }));
}
