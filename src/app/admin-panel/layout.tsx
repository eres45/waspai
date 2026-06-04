import type { ReactNode } from "react";

export const metadata = {
  title: "Wasp AI — Admin Panel",
  description: "Restricted admin area",
  robots: "noindex, nofollow",
};

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  // This layout wraps ALL /admin-panel routes INCLUDING /admin-panel/login.
  // We only guard non-login routes.
  return <>{children}</>;
}
