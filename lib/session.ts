import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "crq_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 hari

function sign(participantId: string): string {
  return createHmac("sha256", env.sessionSecret).update(participantId).digest("hex");
}

/**
 * Cookie sesi hanya berisi participantId + tanda tangan HMAC. Tidak ada
 * password: identitas pemain berasal dari nama + NIP (lihat bagian 7), tapi
 * penulisan skor tetap harus melalui participantId yang tervalidasi server
 * ini supaya tidak bisa dipalsukan lewat Developer Tools.
 */
export function buildSessionCookieValue(participantId: string): string {
  return `${participantId}.${sign(participantId)}`;
}

export function verifySessionCookieValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const [participantId, signature] = value.split(".");
  if (!participantId || !signature) return null;
  const expected = sign(participantId);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, actualBuf)) return null;
  return participantId;
}

export async function getParticipantIdFromSession(): Promise<string | null> {
  const store = await cookies();
  return verifySessionCookieValue(store.get(SESSION_COOKIE_NAME)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}
