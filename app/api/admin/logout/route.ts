import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session";

export async function POST() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
