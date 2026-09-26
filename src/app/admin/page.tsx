import { UsersTable } from "@/components/admin/users-table";
import { hasAdminPermission } from "auth/permissions";
import {
  ADMIN_USER_LIST_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_DIRECTION,
  getAdminUsers,
} from "lib/admin/server";
import { getSession } from "lib/auth/server";

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
    // layout.tsx handles rendering <AdminAccessGate />
    return null;
  }

  const session = await getSession();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? ADMIN_USER_LIST_LIMIT.toString(), 10);
  const offset = (page - 1) * limit;
  const sortBy = params.sortBy ?? DEFAULT_SORT_BY;
  const sortDirection = params.sortDirection ?? DEFAULT_SORT_DIRECTION;

  const result = await getAdminUsers({
    searchValue: params.query,
    searchField: "email",
    searchOperator: "contains",
    limit,
    offset,
    sortBy,
    sortDirection,
  });

  return (
    <UsersTable
      users={result.users}
      currentUserId={session?.user?.id || "admin"}
      total={result.total}
      page={page}
      limit={limit}
      query={params.query}
      baseUrl="/admin"
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
}
