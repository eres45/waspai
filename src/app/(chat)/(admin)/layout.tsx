import type { ReactNode } from "react";
import { requireAdminPermission } from "auth/permissions";
import { unauthorized, unstable_rethrow } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await requireAdminPermission();
  } catch (error) {
    // Re-throw Next.js internal errors (redirect, unauthorized, notFound)
    // so they are handled correctly instead of being caught here
    unstable_rethrow(error);
    unauthorized();
  }
  return <>{children}</>;
}
