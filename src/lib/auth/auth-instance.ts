// Base auth instance without "server-only" - can be used in seed scripts
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { headers } from "next/headers";
import { getAuthConfig } from "./config";
import logger from "logger";
import { DEFAULT_USER_ROLE, USER_ROLES } from "app-types/roles";
import { admin, editor, user, ac } from "./roles";

const {
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
} = getAuthConfig();

const options = {
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [
    adminPlugin({
      defaultRole: DEFAULT_USER_ROLE,
      adminRoles: [USER_ROLES.ADMIN],
      ac,
      roles: {
        admin,
        editor,
        user,
      },
    }),
    nextCookies(),
  ],
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL,
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  // Database adapter disabled - using Supabase Auth instead
  // Better Auth will use in-memory session management for OAuth
  database: undefined,
  emailAndPassword: {
    enabled: emailAndPasswordEnabled,
    disableSignUp: !signUpEnabled,
  },
  session: {
    cookieCache: {
      enabled: false, // Disable cookie cache to prevent session size limit errors
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: (
        Object.keys(
          socialAuthenticationProviders,
        ) as (keyof typeof socialAuthenticationProviders)[]
      ).filter((key) => socialAuthenticationProviders[key]),
    },
  },
  socialProviders: socialAuthenticationProviders,
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins ?? [])],
});

export const getSession = async () => {
  try {
    // Try to get session from cookies first
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authUserCookie = cookieStore.get("auth-user");

    console.log("[DEBUG getSession] Checking for auth-user cookie...");
    console.log(
      "[DEBUG getSession] auth-user cookie value:",
      authUserCookie?.value ? "EXISTS" : "NOT FOUND",
    );

    if (authUserCookie?.value) {
      try {
        const user = JSON.parse(authUserCookie.value);
        console.log(
          "[DEBUG getSession] Successfully parsed auth-user cookie, user:",
          user.id,
        );
        return {
          user,
          session: {
            token: "session-token",
          },
        };
      } catch (error) {
        console.log(
          "[DEBUG getSession] Failed to parse auth-user cookie:",
          error,
        );
        logger.warn("Failed to parse auth-user cookie:", error);
      }
    }

    console.log(
      "[DEBUG getSession] No auth-user cookie found, checking authorization header...",
    );

    // Fallback: try to get from authorization header
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader) {
      logger.debug("No authorization header found");
      return null;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      logger.debug("No token found in authorization header");
      return null;
    }

    // Return a mock session object
    return {
      user: {
        id: "user-id",
        email: "user@example.com",
        name: "User",
      },
      session: {
        token,
      },
    };
  } catch (error) {
    logger.error("Error getting session:", error);
    return null;
  }
};
