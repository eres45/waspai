import "server-only";

import {
  AdminUserListItem,
  AdminUsersPaginated,
  AdminUsersQuery,
} from "app-types/admin";
import {
  requireAdminPermission,
  requireUserListPermission,
} from "lib/auth/permissions";
import { getSession } from "lib/auth/server";
import pgAdminRepository from "lib/db/pg/repositories/admin-respository.pg";

export const ADMIN_USER_LIST_LIMIT = 10;
export const DEFAULT_SORT_BY = "createdAt";
export const DEFAULT_SORT_DIRECTION = "desc";

/**
 * Require an admin session
 * This is a wrapper around the getSession function
 * that throws an error if the user is not an admin
 *
 * @deprecated Use requireAdminPermission() from lib/auth/permissions instead
 */
export async function requireAdminSession(): Promise<
  NonNullable<Awaited<ReturnType<typeof getSession>>>
> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: No session found");
  }

  // Use our new permission system internally
  await requireAdminPermission("access admin functions");

  return session;
}

/**
 * Get paginated users using our custom repository with improved search capabilities
 * Only admins can list and search users
 */
export async function getAdminUsers(
  query?: AdminUsersQuery,
): Promise<AdminUsersPaginated> {
  // Use our new permission system
  await requireUserListPermission("list users in admin panel");
  await getSession();

  try {
    // Use our custom repository with improved search
    const result = await pgAdminRepository.getUsers({
      ...query,
      limit: query?.limit ?? ADMIN_USER_LIST_LIMIT,
      offset: query?.offset ?? 0,
      sortBy: query?.sortBy ?? DEFAULT_SORT_BY,
      sortDirection: query?.sortDirection ?? DEFAULT_SORT_DIRECTION,
    });

    if (result && result.total > 0) {
      return result;
    }
  } catch (error) {
    console.warn(
      "[admin] Direct PG query failed, falling back to Supabase REST client:",
      error,
    );
  }

  // Supabase REST fallback
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const limit = query?.limit ?? ADMIN_USER_LIST_LIMIT;
    const offset = query?.offset ?? 0;
    let q = supabase.from("user").select("*", { count: "exact" });
    if (query?.searchValue) {
      q = q.or(
        `name.ilike.%${query.searchValue}%,email.ilike.%${query.searchValue}%`,
      );
    }
    const orderCol =
      query?.sortBy === "createdAt" ? "created_at" : "created_at";
    q = q
      .order(orderCol, { ascending: query?.sortDirection === "asc" })
      .range(offset, offset + limit - 1);
    const { data, count: totalCount } = await q;
    return {
      users: (data ?? []).map((u: any) => ({
        id: u.id,
        name: u.name ?? "",
        email: u.email ?? "",
        emailVerified: Boolean(u.email_verified),
        image: u.image ?? null,
        role: u.role ?? "user",
        tier: u.tier ?? "free",
        banned: Boolean(u.banned),
        banReason: u.ban_reason ?? null,
        banExpires: u.ban_expires ? new Date(u.ban_expires) : null,
        createdAt: u.created_at ? new Date(u.created_at) : new Date(),
        updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
        welcomeEmailSent: Boolean(u.welcome_email_sent),
        referralCode: u.referral_code ?? null,
        referredBy: u.referred_by ?? null,
        referralCount: u.referral_count ?? 0,
        referralRewardClaimed: Boolean(u.referral_reward_claimed),
        lastSignInIp: u.last_sign_in_ip ?? null,
        referralWidgetHidden: Boolean(u.referral_widget_hidden),
        tierExpiresAt: u.tier_expires_at ? new Date(u.tier_expires_at) : null,
        lastLogin: null,
      })) as unknown as AdminUserListItem[],
      total: totalCount ?? data?.length ?? 0,
      limit,
      offset,
    };
  }

  return { users: [], total: 0, limit: 10, offset: 0 };
}
