import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const ADMIN_SESSION_COOKIE_NAME = "crq_admin_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 jam -- sesi admin sengaja lebih pendek dari sesi pemain

function sign(expiresAt: string): string {
  return createHmac("sha256", env.sessionSecret).update(`admin.${expiresAt}`).digest("hex");
}

/**
 * Cookie sesi admin hanya berisi tanda kedaluwarsa + tanda tangan HMAC --
 * tidak ada identitas di dalamnya (beda dengan sesi pemain), karena admin
 * cuma butuh 1 gerbang passcode statis (bagian env ADMIN_PASSCODE), bukan
 * akun individual.
 */
export function buildAdminSessionCookieValue(): string {
  const expiresAt = String(Date.now() + COOKIE_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyAdminSessionCookieValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;
  const expected = sign(expiresAt);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  if (!timingSafeEqual(expectedBuf, actualBuf)) return false;
  return Date.now() < Number(expiresAt);
}

export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSessionCookieValue(store.get(ADMIN_SESSION_COOKIE_NAME)?.value);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

/** Bandingkan passcode admin dengan durasi konstan supaya tidak bocor lewat timing attack. */
export function verifyAdminPasscode(input: string): boolean {
  const expected = Buffer.from(env.adminPasscode);
  const actual = Buffer.from(input);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
