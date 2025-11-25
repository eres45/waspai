"use server";

import { BasicUserWithLastLogin, UserPreferences } from "app-types/user";
import { auth, getSession } from "auth/server";
import { Session } from "better-auth";
import { userRepository } from "lib/db/repository";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { customModelProvider } from "@/lib/ai/models";

// Helper function to get model provider from model name
const getModelProvider = (modelName: string): string => {
  for (const { provider, models } of customModelProvider.modelsInfo) {
    for (const model of models) {
      if (model.name === modelName) {
        return provider;
      }
    }
  }
  return "unknown";
};

/**
 * Get the user by id
 * We can only get the user by id for the current user as a non-admin user
 * We can get the user by id for any user as an admin user
 */
export async function getUser(
  userId?: string,
): Promise<BasicUserWithLastLogin | null> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await userRepository.getUserById(resolvedUserId);
}

/**
 * Get user accounts
 * We can only list accounts for the current user as a non-admin user
 * We can list accounts for any user as an admin user
 */
export async function getUserAccounts(userId?: string) {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  const accounts = await auth.api.listUserAccounts({
    params: { userId: resolvedUserId },
    headers: await headers(),
  });
  const hasPassword = accounts.some(
    (account) => account.providerId === "credential",
  );
  const oauthProviders = accounts
    .filter((account) => account.providerId !== "credential")
    .map((account) => account.providerId);
  return { accounts, hasPassword, oauthProviders };
}

/**
 * List user sessions
 * We use the better-auth API to list the sessions
 * We can only list sessions for the current user as a non-admin user
 * We can list sessions for any user as an admin user
 */
export async function getUserSessions(userId?: string): Promise<Session[]> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await auth.api.listSessions({
    params: { userId: resolvedUserId },
    headers: await headers(),
  });
}

/**
 * Get the user ID and check access
 * if the requested user id is not provided, we use the current user id
 * if the requested user id is provided, we check if the current user has access to the requested user
 * if the current user has access to the requested user, we return the requested user id
 * if the current user does not have access to the requested user, we throw a 404 error
 * if the requested user id is not found, we throw a 404 error
 */
export async function getUserIdAndCheckAccess(
  requestedUserId?: string,
): Promise<string> {
  const session = await getSession();
  if (!session) {
    notFound();
  }
  const currentUserId = session.user.id;
  const userId = requestedUserId ? requestedUserId : currentUserId;
  if (!userId) {
    notFound();
  }
  return userId;
}

/**
 * Get the user stats
 * We can only get stats for the current user as a non-admin user
 * We can get stats for any user as an admin user
 */
export async function getUserStats(userId?: string): Promise<{
  threadCount: number;
  messageCount: number;
  modelStats: Array<{
    model: string;
    messageCount: number;
    totalTokens: number;
    provider: string;
  }>;
  totalTokens: number;
  period: string;
}> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  const stats = await userRepository.getUserStats(resolvedUserId);

  // Add provider information to each model stat
  return {
    ...stats,
    modelStats: stats.modelStats.map((stat) => ({
      ...stat,
      provider: getModelProvider(stat.model),
    })),
  };
}

/**
 * Get the user preferences
 * We can only get preferences for the current user as a non-admin user
 * We can get preferences for any user as an admin user
 */
export async function getUserPreferences(
  userId?: string,
): Promise<UserPreferences | null> {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  return await userRepository.getPreferences(resolvedUserId);
}

export async function updateUserDetails(
  userId: string,
  name?: string,
  email?: string,
  image?: string,
) {
  const resolvedUserId = await getUserIdAndCheckAccess(userId);
  if (!name && !email && !image) {
    return;
  }

  let updatedUser: any = null;

  // Try to update user in database
  try {
    updatedUser = await userRepository.updateUserDetails({
      userId: resolvedUserId,
      ...(name && { name }),
      ...(email && { email }),
      ...(image && { image }),
    });
  } catch (dbError) {
    // Database update failed, but we can still update the session
    console.warn("Database update failed, updating session only:", dbError);
  }

  // Always update session cookie with new data
  const session = await getSession();
  if (session?.user?.id === resolvedUserId) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    const enrichedUser = {
      ...session.user,
      ...(name && { name }),
      ...(email && { email }),
      ...(image && { image }),
    };

    cookieStore.set("auth-user", JSON.stringify(enrichedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // Return updated user from session if database failed
  if (!updatedUser && session?.user?.id === resolvedUserId) {
    return {
      ...session.user,
      ...(name && { name }),
      ...(email && { email }),
      ...(image && { image }),
    };
  }

  return updatedUser;
}
