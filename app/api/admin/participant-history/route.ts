import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { adminParticipantIdSchema } from "@/lib/validators";
import { getParticipantProgressHistory } from "@/lib/data";
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
    const history = await getParticipantProgressHistory(parsed.data.participantId);
    return NextResponse.json({ ok: true, history });
  } catch (error) {
    console.error("[api/admin/participant-history] gagal ambil riwayat peserta", error);
    return NextResponse.json({ ok: false, message: COPY.errors.generic }, { status: 500 });
  }
}
