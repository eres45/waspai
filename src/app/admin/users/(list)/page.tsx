import { redirect } from "next/navigation";

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

export default async function AdminUsersRedirectPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set("tab", "users");
  if (params.page) q.set("page", params.page);
  if (params.limit) q.set("limit", params.limit);
  if (params.query) q.set("query", params.query);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.sortDirection) q.set("sortDirection", params.sortDirection);
  redirect(`/admin?${q.toString()}`);
}
