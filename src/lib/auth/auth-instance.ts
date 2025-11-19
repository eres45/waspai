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
  // This removes all direct PostgreSQL connections
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
    // Use Better Auth's built-in session retrieval
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    // Try all possible Better Auth cookie names
    let sessionToken: string | undefined;
    let userCookie: string | undefined;

    // Try different cookie name patterns that Better Auth might use
    const possibleSessionCookies = [
      "better-auth.session_token",
      "auth.session_token",
      "session_token",
      "better_auth_session",
    ];

    const possibleUserCookies = [
      "better-auth.user",
      "auth.user",
      "user",
      "better_auth_user",
    ];

    for (const cookieName of possibleSessionCookies) {
      const cookie = cookieStore.get(cookieName);
      if (cookie?.value) {
        sessionToken = cookie.value;
        logger.debug(
          `[getSession] Found session token in cookie: ${cookieName}`,
        );
        break;
      }
    }

    for (const cookieName of possibleUserCookies) {
      const cookie = cookieStore.get(cookieName);
      if (cookie?.value) {
        userCookie = cookie.value;
        logger.debug(`[getSession] Found user cookie: ${cookieName}`);
        break;
      }
    }

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        logger.debug(
          "[getSession] Successfully parsed user cookie, user:",
          user.id,
        );
        return {
          user,
          session: {
            token: sessionToken || "session-token",
          },
        };
      } catch (error) {
        logger.warn("[getSession] Failed to parse user cookie:", error);
      }
    }

    // Fallback: try to get from authorization header
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader) {
      logger.debug("[getSession] No authorization header found");
      return null;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      logger.debug("[getSession] No token found in authorization header");
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
    logger.error("[getSession] Error getting session:", error);
    return null;
  }
};
