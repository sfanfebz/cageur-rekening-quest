import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { resetAllParticipantsProgress } from "@/lib/data";
import { COPY } from "@/lib/constants";

export async function POST() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 401 });
  }

  try {
    const result = await resetAllParticipantsProgress();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/admin/reset-all] gagal reset progres semua peserta", error);
    return NextResponse.json({ ok: false, message: COPY.errors.generic }, { status: 500 });
  }
}
