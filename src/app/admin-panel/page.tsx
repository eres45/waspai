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

async function getDashboardStats() {
  const [
    [{ totalUsers }],
    [{ totalChats }],
    [{ totalMessages }],
    [{ totalAgents }],
    [{ totalWorkflows }],
    [{ totalSites }],
    recentUsers,
    usersByRole,
  ] = await Promise.all([
    pgDb.select({ totalUsers: count() }).from(UserTable),
    pgDb.select({ totalChats: count() }).from(ChatThreadTable),
    pgDb.select({ totalMessages: count() }).from(ChatMessageTable),
    pgDb.select({ totalAgents: count() }).from(AgentTable),
    pgDb.select({ totalWorkflows: count() }).from(WorkflowTable),
    pgDb.select({ totalSites: count() }).from(DeployedSiteTable),
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
      .limit(20),
    pgDb
      .select({ role: UserTable.role, count: count() })
      .from(UserTable)
      .groupBy(UserTable.role),
  ]);

  return {
    totalUsers,
    totalChats,
    totalMessages,
    totalAgents,
    totalWorkflows,
    totalSites,
    recentUsers,
    usersByRole,
  };
}

export default async function AdminPanelPage() {
  const email = await getAdminSession();
  if (!email) {
    redirect("/admin-panel/login");
  }

  const stats = await getDashboardStats();

  return <AdminDashboard stats={stats} adminEmail={email} />;
}
