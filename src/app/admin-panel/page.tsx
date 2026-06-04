import { redirect } from "next/navigation";
import { getAdminSession } from "lib/admin-panel/auth";
import { pgDb } from "lib/db/pg/db.pg";
import {
  UserTable,
  ChatThreadTable,
  ChatMessageTable,
  AgentTable,
  WorkflowTable,
  DeployedSiteTable,
} from "lib/db/pg/schema.pg";
import { count, desc, eq, sql } from "drizzle-orm";
import AdminDashboard from "./AdminDashboard";

const defaultStats = {
  totalUsers: 0,
  totalChats: 0,
  totalMessages: 0,
  totalAgents: 0,
  totalWorkflows: 0,
  totalSites: 0,
  recentUsers: [] as {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    banned: boolean | null;
  }[],
  usersByRole: [] as { role: string; count: number }[],
  totalTokens: 0,
  totalApiCalls: 0,
  totalCreditsUsed: 0.0,
  subscriptions: [] as { tier: string; count: number }[],
  analytics: {
    registrations: [] as { date: string; count: number }[],
    traffic: [] as { date: string; count: number; tokens: number }[],
    models: [] as { model: string; tokens: number; count: number }[],
  },
  error: null as string | null,
};

async function getDashboardStats() {
  try {
    const [
      usersResult,
      chatsResult,
      messagesResult,
      agentsResult,
      workflowsResult,
      sitesResult,
      recentUsers,
      usersByRole,
      tokenUsageResult,
      apiCallsResult,
      subscriptionsResult,
      registrationsOverTime,
      messagesOverTime,
      modelBreakdown,
    ] = await Promise.all([
      pgDb
        .select({ v: count() })
        .from(UserTable)
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({ v: count() })
        .from(ChatThreadTable)
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({ v: count() })
        .from(ChatMessageTable)
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({ v: count() })
        .from(AgentTable)
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({ v: count() })
        .from(WorkflowTable)
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({ v: count() })
        .from(DeployedSiteTable)
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({
          id: UserTable.id,
          name: UserTable.name,
          email: UserTable.email,
          role: UserTable.role,
          createdAt: UserTable.createdAt,
          banned: UserTable.banned,
        })
        .from(UserTable)
        .orderBy(desc(UserTable.createdAt))
        .limit(20)
        .catch(() => []),
      pgDb
        .select({ role: UserTable.role, count: count() })
        .from(UserTable)
        .groupBy(UserTable.role)
        .catch(() => []),
      pgDb
        .select({
          input: sql<number>`COALESCE(SUM((${ChatMessageTable.metadata}->'usage'->>'inputTokens')::numeric), 0)`,
          output: sql<number>`COALESCE(SUM((${ChatMessageTable.metadata}->'usage'->>'outputTokens')::numeric), 0)`,
          total: sql<number>`COALESCE(SUM((${ChatMessageTable.metadata}->'usage'->>'totalTokens')::numeric), 0)`,
        })
        .from(ChatMessageTable)
        .catch(() => [{ input: 0, output: 0, total: 0 }]),
      pgDb
        .select({ v: count() })
        .from(ChatMessageTable)
        .where(eq(ChatMessageTable.role, "assistant"))
        .catch(() => [{ v: 0 }]),
      pgDb
        .select({ tier: UserTable.tier, count: count() })
        .from(UserTable)
        .groupBy(UserTable.tier)
        .catch(() => []),
      pgDb
        .select({
          date: sql<string>`TO_CHAR(${UserTable.createdAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(UserTable)
        .groupBy(sql`TO_CHAR(${UserTable.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`TO_CHAR(${UserTable.createdAt}, 'YYYY-MM-DD') ASC`)
        .limit(30)
        .catch(() => []),
      pgDb
        .select({
          date: sql<string>`TO_CHAR(${ChatMessageTable.createdAt}, 'YYYY-MM-DD')`,
          count: count(),
          tokens: sql<number>`COALESCE(SUM((${ChatMessageTable.metadata}->'usage'->>'totalTokens')::numeric), 0)`,
        })
        .from(ChatMessageTable)
        .groupBy(sql`TO_CHAR(${ChatMessageTable.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`TO_CHAR(${ChatMessageTable.createdAt}, 'YYYY-MM-DD') ASC`)
        .limit(30)
        .catch(() => []),
      pgDb
        .select({
          model: sql<string>`COALESCE(${ChatMessageTable.metadata}->'chatModel'->>'model', 'unknown')`,
          tokens: sql<number>`COALESCE(SUM((${ChatMessageTable.metadata}->'usage'->>'totalTokens')::numeric), 0)`,
          count: count(),
        })
        .from(ChatMessageTable)
        .where(sql`${ChatMessageTable.metadata} IS NOT NULL`)
        .groupBy(sql`${ChatMessageTable.metadata}->'chatModel'->>'model'`)
        .orderBy(
          sql`SUM((${ChatMessageTable.metadata}->'usage'->>'totalTokens')::numeric) DESC`,
        )
        .limit(10)
        .catch(() => []),
    ]);

    const inputTokens = Number(tokenUsageResult[0]?.input ?? 0);
    const outputTokens = Number(tokenUsageResult[0]?.output ?? 0);
    const totalTokens = Number(tokenUsageResult[0]?.total ?? 0);
    const apiCalls = Number(apiCallsResult[0]?.v ?? 0);

    // Standard credit calculation: $1.50 per 1M input tokens, $5.00 per 1M output tokens
    const estCredits = (inputTokens * 1.5 + outputTokens * 5.0) / 1000000;

    return {
      totalUsers: Number(usersResult[0]?.v ?? 0),
      totalChats: Number(chatsResult[0]?.v ?? 0),
      totalMessages: Number(messagesResult[0]?.v ?? 0),
      totalAgents: Number(agentsResult[0]?.v ?? 0),
      totalWorkflows: Number(workflowsResult[0]?.v ?? 0),
      totalSites: Number(sitesResult[0]?.v ?? 0),
      recentUsers,
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: Number(r.count),
      })),
      totalTokens,
      totalApiCalls: apiCalls,
      totalCreditsUsed: estCredits,
      subscriptions: subscriptionsResult.map((s) => ({
        tier: s.tier || "free",
        count: Number(s.count),
      })),
      analytics: {
        registrations: registrationsOverTime.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
        traffic: messagesOverTime.map((m) => ({
          date: m.date,
          count: Number(m.count),
          tokens: Number(m.tokens),
        })),
        models: modelBreakdown.map((m) => ({
          model: m.model,
          tokens: Number(m.tokens),
          count: Number(m.count),
        })),
      },
      error: null,
    };
  } catch (err) {
    console.error("[admin-panel] getDashboardStats error:", err);
    return {
      ...defaultStats,
      error: "Could not load stats — DB connection issue",
    };
  }
}

export default async function AdminPanelPage() {
  const email = await getAdminSession();
  if (!email) {
    redirect("/admin-panel/login");
  }

  const stats = await getDashboardStats();

  return <AdminDashboard stats={stats} adminEmail={email} />;
}
