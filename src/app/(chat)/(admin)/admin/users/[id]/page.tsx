import { UserDetail } from "@/components/user/user-detail/user-detail";
import {
  UserStatsCardLoader,
  UserStatsCardLoaderSkeleton,
} from "@/components/user/user-detail/user-stats-card-loader";
import { getUser, getUserAccounts } from "lib/user/server";
import { notFound } from "next/navigation";

import { hasAdminPermission } from "auth/permissions";
import { getSession } from "auth/server";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isAdmin = await hasAdminPermission();
  if (!isAdmin) {
    return null;
  }
  const session = await getSession();
  const [user, userAccountInfo] = await Promise.all([
    getUser(id),
    getUserAccounts(id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <UserDetail
      user={user}
      currentUserId={session?.user?.id || "admin"}
      userAccountInfo={userAccountInfo}
      userStatsSlot={
        <Suspense fallback={<UserStatsCardLoaderSkeleton />}>
          <UserStatsCardLoader userId={id} view="admin" />
        </Suspense>
      }
      view="admin"
    />
  );
}
