// Base auth instance without "server-only" - can be used in seed scripts
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
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
  // Use Supabase as database adapter for Better Auth
  // This allows sessions to be stored properly
  database: {
    type: "postgres",
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  } as any,
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
    // Get cookies from request
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    // Better Auth stores session in cookies with these names
    // Try to find the session token cookie
    const sessionCookie =
      cookieStore.get("better-auth.session_token")?.value ||
      cookieStore.get("auth.session_token")?.value ||
      cookieStore.get("session_token")?.value;

    logger.debug("[getSession] Session cookie found:", !!sessionCookie);

    if (!sessionCookie) {
      logger.debug("[getSession] No session cookie found");
      return null;
    }

    // Try to get user from cookie
    const userCookie =
      cookieStore.get("better-auth.user")?.value ||
      cookieStore.get("auth.user")?.value ||
      cookieStore.get("user")?.value;

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        logger.debug(
          "[getSession] Successfully parsed user from cookie:",
          user.id,
        );
        return {
          user,
          session: {
            token: sessionCookie,
          },
        };
      } catch (error) {
        logger.warn("[getSession] Failed to parse user cookie:", error);
      }
    }

    // If no user cookie, return minimal session
    logger.debug("[getSession] No user cookie, but session token exists");
    return {
      user: {
        id: "unknown",
        email: "unknown@example.com",
        name: "Unknown",
      },
      session: {
        token: sessionCookie,
      },
    };
  } catch (error) {
    logger.error("[getSession] Error getting session:", error);
    return null;
  }
};
