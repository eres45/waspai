import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";

// Initialize Supabase client - only on server
let supabaseAuthInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseAuth() {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAuth can only be used on the server");
  }

  if (!supabaseAuthInstance) {
    if (!process.env.SUPABASE_URL) {
      throw new Error("SUPABASE_URL environment variable is not set");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY environment variable is not set",
      );
    }

    supabaseAuthInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAuthInstance;
}

export const supabaseAuth = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_target, prop) => {
    return getSupabaseAuth()[prop as keyof ReturnType<typeof createClient>];
  },
});

/**
 * Sign up a new user with email and password
 * Requires email verification before user can sign in
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
) {
  try {
    logger.info(`Signing up user: ${email}`);

    // Create user in Supabase Auth with email verification required
    const { data, error } = await supabaseAuth.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
      },
      email_confirm: false, // Require email verification
    });

    if (error) {
      logger.error(`Sign up error for ${email}:`, error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("User creation failed");
    }

    logger.info(
      `User created successfully: ${data.user.id}. Verification email sent.`,
    );

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || data.user.user_metadata?.name || "",
        email_confirmed_at: data.user.email_confirmed_at,
      },
      requiresEmailVerification: !data.user.email_confirmed_at,
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

/**
 * Send password reset email
 * User receives email with link to reset password
 */
export async function resetPasswordForEmail(
  email: string,
  redirectTo: string = `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
) {
  try {
    logger.info(`Password reset requested for: ${email}`);

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      logger.error(`Password reset error for ${email}:`, error);
      throw new Error(error.message);
    }

    logger.info(`Password reset email sent to: ${email}`);

    return {
      success: true,
      message: "Password reset email sent. Check your inbox.",
    };
  } catch (error) {
    logger.error("Password reset error:", error);
    throw error;
  }
}

/**
 * Update user password (used after password reset)
 * Must be called by authenticated user or with valid session
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    logger.info(`Updating password for user: ${userId}`);

    const { error } = await supabaseAuth.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      logger.error(`Password update error for ${userId}:`, error);
      throw new Error(error.message);
    }

    logger.info(`Password updated successfully for user: ${userId}`);

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    logger.error("Password update error:", error);
    throw error;
  }
}

/**
 * Verify email by sending confirmation email
 * User receives email with verification link
 */
export async function sendEmailVerification(
  email: string,
  redirectTo: string = `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email`,
) {
  try {
    logger.info(`Email verification requested for: ${email}`);

    // Get user by email
    const { data: userData, error: getUserError } =
      await supabaseAuth.auth.admin.listUsers();

    if (getUserError) {
      logger.error("Error listing users:", getUserError);
      throw new Error("Failed to verify email");
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      logger.warn(`User not found for email: ${email}`);
      throw new Error("User not found");
    }

    // Check if email is already verified
    if (user.email_confirmed_at) {
      logger.info(`Email already verified for: ${email}`);
      return {
        success: true,
        message: "Email is already verified",
        verified: true,
      };
    }

    // Send verification email using Supabase's built-in email service
    // This uses the "Confirm sign up" email template
    const { error } = await supabaseAuth.auth.admin.generateLink({
      type: "signup",
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password for link generation
      options: {
        redirectTo,
      },
    });

    if (error) {
      logger.error(`Email verification error for ${email}:`, error);
      throw new Error(error.message);
    }

    logger.info(`Email verification link sent to: ${email}`);

    return {
      success: true,
      message: "Verification email sent. Check your inbox.",
      verified: false,
    };
  } catch (error) {
    logger.error("Email verification error:", error);
    throw error;
  }
}
