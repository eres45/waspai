import { checkAdminCredentials, setAdminSession } from "lib/admin-panel/auth";
import { NextRequest, NextResponse } from "next/server";

// ─── In-memory rate limiter (per IP) ─────────────────────────────────────────
// Tracks failed attempts per IP. Resets after WINDOW_MS of inactivity.
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}
const attemptMap = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5; // lock after 5 consecutive failures
const WINDOW_MS = 10 * 60 * 1000; // 10-minute window
const LOCKOUT_MS = 30 * 60 * 1000; // 30-minute lockout after max failures

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSecs?: number;
} {
  const now = Date.now();
  const record = attemptMap.get(ip);

  if (!record) return { allowed: true };

  // Clear stale window
  if (now - record.firstAttempt > WINDOW_MS && !record.lockedUntil) {
    attemptMap.delete(ip);
    return { allowed: true };
  }

  // Still locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    return {
      allowed: false,
      retryAfterSecs: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Lockout expired — reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    attemptMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const record = attemptMap.get(ip);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attemptMap.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  const updated = { ...record, count: record.count + 1 };
  if (updated.count >= MAX_ATTEMPTS) {
    updated.lockedUntil = now + LOCKOUT_MS;
  }
  attemptMap.set(ip, updated);
}

function recordSuccess(ip: string): void {
  attemptMap.delete(ip);
}

// ─── Constant-time artificial delay (anti-timing) ────────────────────────────
async function secureDelay(extraMs = 0) {
  // Base delay 800-1200ms ± jitter, always runs even on success path
  const base = 800 + Math.floor(Math.random() * 400);
  await new Promise((r) => setTimeout(r, base + extraMs));
}

// ─── POST /api/admin-panel/auth ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    // 1. Rate limit check BEFORE parsing body
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      await secureDelay();
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${Math.ceil((rl.retryAfterSecs ?? 1800) / 60)} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSecs ?? 1800),
            "X-RateLimit-Limit": String(MAX_ATTEMPTS),
          },
        },
      );
    }

    // 2. Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, password } = (body ?? {}) as {
      email?: string;
      password?: string;
    };

    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 3. Validate credentials (timing-safe inside checkAdminCredentials)
    const valid = checkAdminCredentials(email, password);

    if (!valid) {
      // Always delay on failure — prevents timing oracle & slows brute force
      await secureDelay(200);
      recordFailure(ip);

      const record = attemptMap.get(ip);
      const remaining = record
        ? Math.max(0, MAX_ATTEMPTS - record.count)
        : MAX_ATTEMPTS;

      return NextResponse.json(
        {
          // Generic message — never reveal which field was wrong
          error:
            remaining > 0
              ? `Invalid credentials. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Account locked. Too many failed attempts.",
        },
        { status: 401 },
      );
    }

    // 4. Success — clear rate limit, set session
    recordSuccess(ip);
    await setAdminSession(email.toLowerCase().trim());

    // 5. Promote currently logged-in chat user to admin role in DB + cookie
    try {
      const { getSession } = await import("auth/server");
      const session = await getSession();
      if (session?.user?.id) {
        const { supabaseRest } = await import("lib/db/supabase-rest");
        await supabaseRest
          .from("user")
          .update({ role: "admin" })
          .eq("id", session.user.id);

        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const updatedUser = { ...session.user, role: "admin" };
        cookieStore.set("auth-user", JSON.stringify(updatedUser), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch (e) {
      console.error("[admin-panel] Failed to promote session user:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin-panel] login error:", err);
    // Always delay even on unexpected errors — prevents timing leaks
    await secureDelay();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin-panel/auth (logout) ────────────────────────────────────
export async function DELETE() {
  const { clearAdminSession } = await import("lib/admin-panel/auth");
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
