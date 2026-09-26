import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { hasAdminPermission } from "auth/permissions";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    const isAdmin = await hasAdminPermission();
    if (!isAdmin) {
      return <AdminAccessGate />;
    }
    return <>{children}</>;
  } catch (error) {
    console.error("[admin-layout] Error checking admin permission:", error);
    return <AdminAccessGate />;
  }
}
