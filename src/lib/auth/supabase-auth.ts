import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is not set");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
}

export const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
) {
  try {
    logger.info(`Signing up user: ${email}`);

    // Create user in Supabase Auth
    const { data, error } = await supabaseAuth.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
      },
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      logger.error(`Sign up error for ${email}:`, error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("User creation failed");
    }

    logger.info(`User created successfully: ${data.user.id}`);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || data.user.user_metadata?.name || "",
      },
    };
  } catch (error) {
    logger.error("Sign up error:", error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    logger.info(`Signing in user: ${email}`);

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error(`Sign in error for ${email}:`, error);
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Sign in failed");
    }

    logger.info(`User signed in successfully: ${data.user.id}`);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || "",
      },
      session: data.session,
    };
  } catch (error) {
    logger.error("Sign in error:", error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabaseAuth.auth.admin.getUserById(userId);

    if (error) {
      logger.error(`Get user error for ${userId}:`, error);
      return null;
    }

    if (!data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || "",
    };
  } catch (error) {
    logger.error("Get user error:", error);
    return null;
  }
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAuth.auth.admin.listUsers();

    if (error) {
      logger.error("List users error:", error);
      return false;
    }

    return data.users.some((user) => user.email === email);
  } catch (error) {
    logger.error("Email exists check error:", error);
    return false;
  }
}
