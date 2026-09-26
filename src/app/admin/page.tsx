import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { hasAdminPermission } from "auth/permissions";
import {
  type AdminDashboardStats,
  getAdminDashboardStats,
} from "lib/admin/dashboard";
import {
  ADMIN_USER_LIST_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_DIRECTION,
  getAdminUsers,
} from "lib/admin/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    query?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }>;
}

export default async function AdminIndexPage({ searchParams }: PageProps) {
  const isAdmin = await hasAdminPermission();
  if (!isAdmin) {
    // layout.tsx renders <AdminAccessGate />
    return null;
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = parseInt(params.limit ?? ADMIN_USER_LIST_LIMIT.toString(), 10);
  const offset = (page - 1) * limit;
  const sortBy = params.sortBy ?? DEFAULT_SORT_BY;
  const sortDirection = params.sortDirection ?? DEFAULT_SORT_DIRECTION;

  let stats: AdminDashboardStats;
  let usersResult = { users: [], total: 0 };

  try {
    const [fetchedStats, fetchedUsers] = await Promise.all([
      getAdminDashboardStats(),
      getAdminUsers({
        searchValue: params.query,
        searchField: "email",
        searchOperator: "contains",
        limit,
        offset,
        sortBy,
        sortDirection,
      }).catch((err) => {
        console.error("[admin] Error fetching admin users:", err);
        return { users: [], total: 0 };
      }),
    ]);
    stats = fetchedStats;
    usersResult = fetchedUsers;
  } catch (error) {
    console.error("[admin] Error loading admin dashboard data:", error);
    stats = await getAdminDashboardStats();
  }

  return (
    <AdminDashboard
      stats={stats}
      users={usersResult.users}
      total={usersResult.total}
      page={page}
      limit={limit}
      query={params.query}
    />
  );
}
