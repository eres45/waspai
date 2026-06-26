import { getSession } from "./server";
import { supabaseAuth } from "./supabase-auth";

/**
 * A unified session resolver that works for both Web (Cookies) and Mobile (Bearer Token).
 * If a valid Supabase Bearer token is found, it constructs a compatible session object.
 * Otherwise, it falls back to Better Auth's getSession().
 */
export async function getUnifiedSession(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    // Check if the request is from the mobile app (using Supabase JWT)
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7); // "Bearer ".length
      const { data, error } = await supabaseAuth.auth.getUser(token);

      if (!error && data?.user) {
        // Return a shape compatible with the Better Auth session object
        return {
          user: {
            id: data.user.id,
            email: data.user.email,
            name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "User",
            emailVerified: data.user.email_confirmed_at != null,
            createdAt: new Date(data.user.created_at),
            updatedAt: new Date(data.user.updated_at || data.user.created_at),
            image: data.user.user_metadata?.avatar_url || null,
          },
          session: {
            id: "mobile_jwt", // Mock session ID
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            userId: data.user.id,
          },
        };
      }
    }

    // Fallback to Web session (Better Auth Cookies)
    return await getSession();
  } catch (err) {
    console.error("Error in getUnifiedSession:", err);
    return null;
  }
}
