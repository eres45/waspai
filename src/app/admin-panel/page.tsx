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
import { count, desc } from "drizzle-orm";
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
    ]);

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
