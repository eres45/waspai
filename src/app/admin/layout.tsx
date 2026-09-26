import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { hasAdminPermission } from "auth/permissions";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isAdmin = await hasAdminPermission();
  if (!isAdmin) {
    return <AdminAccessGate />;
  }

  return <>{children}</>;
}
