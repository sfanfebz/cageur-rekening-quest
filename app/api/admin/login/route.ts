import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { passcodeSchema } from "@/lib/validators";
import { verifyAdminPasscode, buildAdminSessionCookieValue, adminSessionCookieOptions, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  const parsed = passcodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  // Passcode admin divalidasi di server terhadap environment variable ADMIN_PASSCODE,
  // tidak pernah ditulis di kode frontend (pola sama dengan LEADERBOARD_PASSCODE).
  if (!verifyAdminPasscode(parsed.data.passcode)) {
    return NextResponse.json({ ok: false, message: COPY.errors.wrongPasscode }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE_NAME, buildAdminSessionCookieValue(), adminSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
