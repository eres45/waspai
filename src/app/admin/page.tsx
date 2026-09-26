import { hasAdminPermission } from "auth/permissions";
import { redirect } from "next/navigation";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const isAdmin = await hasAdminPermission();
  if (isAdmin) {
    redirect("/admin/users");
  }
  // Not admin — layout.tsx will render <AdminAccessGate />
  return null;
}
