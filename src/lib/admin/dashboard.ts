import "server-only";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { pgDb as db } from "lib/db/pg/db.pg";
import {
  ChatMessageTable,
  ChatThreadTable,
  UserTable,
} from "lib/db/pg/schema.pg";

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  adminUsers: number;
  bannedUsers: number;
  proUsers: number;
  freeUsers: number;
  totalChats: number;
  totalMessages: number;
  // Last 6 months user signups for chart
  monthlySignups: { month: string; count: number }[];
  // Recent 5 users
  recentUsers: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    tier: string;
    createdAt: Date;
    banned: boolean | null;
  }[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
  );

  const [
    totalUsersResult,
    newThisMonthResult,
    newLastMonthResult,
    adminUsersResult,
    bannedUsersResult,
    proUsersResult,
    totalChatsResult,
    totalMessagesResult,
    monthlySignupsResult,
    recentUsersResult,
  ] = await Promise.all([
    // Total users
    db
      .select({ count: count() })
      .from(UserTable),

    // New this month
    db
      .select({ count: count() })
      .from(UserTable)
      .where(gte(UserTable.createdAt, startOfThisMonth)),

    // New last month
    db
      .select({ count: count() })
      .from(UserTable)
      .where(
        and(
          gte(UserTable.createdAt, startOfLastMonth),
          sql`${UserTable.createdAt} <= ${endOfLastMonth}`,
        ),
      ),

    // Admin users
    db
      .select({ count: count() })
      .from(UserTable)
      .where(eq(UserTable.role, "admin")),

    // Banned users
    db
      .select({ count: count() })
      .from(UserTable)
      .where(eq(UserTable.banned, true)),

    // Pro users
    db
      .select({ count: count() })
      .from(UserTable)
      .where(eq(UserTable.tier, "pro")),

    // Total chat threads
    db
      .select({ count: count() })
      .from(ChatThreadTable),

    // Total messages
    db
      .select({ count: count() })
      .from(ChatMessageTable),

    // Monthly signups last 6 months
    db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        DATE_TRUNC('month', created_at) AS month_date,
        COUNT(*)::int AS count
      FROM "user"
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `),

    // Recent 5 users
    db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        image: UserTable.image,
        role: UserTable.role,
        tier: UserTable.tier,
        createdAt: UserTable.createdAt,
        banned: UserTable.banned,
      })
      .from(UserTable)
      .orderBy(sql`${UserTable.createdAt} DESC`)
      .limit(5),
  ]);

  return {
    totalUsers: totalUsersResult[0]?.count ?? 0,
    newUsersThisMonth: newThisMonthResult[0]?.count ?? 0,
    newUsersLastMonth: newLastMonthResult[0]?.count ?? 0,
    adminUsers: adminUsersResult[0]?.count ?? 0,
    bannedUsers: bannedUsersResult[0]?.count ?? 0,
    proUsers: proUsersResult[0]?.count ?? 0,
    freeUsers:
      (totalUsersResult[0]?.count ?? 0) - (proUsersResult[0]?.count ?? 0),
    totalChats: totalChatsResult[0]?.count ?? 0,
    totalMessages: totalMessagesResult[0]?.count ?? 0,
    monthlySignups:
      (monthlySignupsResult.rows as { month: string; count: number }[]) ?? [],
    recentUsers: recentUsersResult,
  };
}
