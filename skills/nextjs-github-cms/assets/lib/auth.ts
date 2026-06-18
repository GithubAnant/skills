import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "editor_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  return pw;
}

export function verifyPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (input.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Stateless session: the cookie value is an HMAC signature of a fixed payload
 * using ADMIN_PASSWORD as the secret key. No server-side state needed — works
 * perfectly on serverless (Vercel) because validation only needs the env var.
 *
 * A consequence worth knowing: rotating ADMIN_PASSWORD invalidates every
 * existing session, because the HMAC key changes. That's usually what you want.
 */
function signSession(): string {
  const hmac = createHmac("sha256", getAdminPassword());
  hmac.update("editor_session_v1");
  return hmac.digest("hex");
}

function verifySession(token: string): boolean {
  try {
    const expected = signSession();
    if (token.length !== expected.length) return false;
    return timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifySession(token);
  } catch {
    return false;
  }
}

export function createSession(): string {
  return signSession();
}

export function getSessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function getClearCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
