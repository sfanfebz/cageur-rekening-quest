import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { adminParticipantIdSchema } from "@/lib/validators";
import { resetParticipantProgress } from "@/lib/data";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 401 });
  }

  const parsed = adminParticipantIdSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  try {
    const result = await resetParticipantProgress(parsed.data.participantId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/admin/reset-participant] gagal reset progres peserta", error);
    return NextResponse.json({ ok: false, message: COPY.errors.generic }, { status: 500 });
  }
}
