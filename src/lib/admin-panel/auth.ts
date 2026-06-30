import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// ─── Hardcoded admin credentials (server-only, never sent to client) ──────────
const ADMIN_CREDENTIALS: Record<string, string> = {
  "waspai@admin.in": "ronit@9325296264",
  "ronit@waspai.in": "ronit@1070576",
};

const COOKIE_NAME = "waspai_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  return (
    process.env.BETTER_AUTH_SECRET ||
    process.env.ADMIN_PANEL_SECRET ||
    "waspai-admin-secret-key-change-in-prod"
  );
}

function signToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 3) return null;

    // last part is signature, before it is timestamp, before that is email (may contain @)
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(":");
    const expectedSig = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;

    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    // Extract email (everything before the last :timestamp part)
    const payloadParts = payload.split(":");
    const email = payloadParts.slice(0, -1).join(":");
    return email || null;
  } catch {
    return null;
  }
}

export function checkAdminCredentials(
  email: string,
  password: string,
): boolean {
  const storedPassword = ADMIN_CREDENTIALS[email.toLowerCase().trim()];
  if (!storedPassword) return false;
  // timing-safe compare
  try {
    const a = Buffer.from(storedPassword);
    const b = Buffer.from(password);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAdminSession(email: string): Promise<void> {
  const token = signToken(email);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/admin-panel",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdminPanelSession(): Promise<string> {
  const email = await getAdminSession();
  if (!email) {
    throw new Error("Unauthorized");
  }
  return email;
}
