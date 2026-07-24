import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { identitySchema } from "@/lib/validators";
import { buildUniqueKey, cleanFullName, normalizeName } from "@/lib/format";
import { upsertParticipant, getActiveCampaign, ensureParticipantCampaignProgress } from "@/lib/data";
import { buildSessionCookieValue, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/session";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  const parsed = identitySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? COPY.errors.validation;
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  try {
    const fullName = cleanFullName(parsed.data.fullName);
    const normalizedName = normalizeName(fullName);
    const nip = parsed.data.nip.trim();
    const uniqueKey = buildUniqueKey(nip, normalizedName);

    const participant = await upsertParticipant({ fullName, normalizedName, nip, uniqueKey });

    const activeCampaign = await getActiveCampaign();
    if (activeCampaign) {
      await ensureParticipantCampaignProgress(participant.id, activeCampaign.id);
    }

    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, buildSessionCookieValue(participant.id), sessionCookieOptions());

    return NextResponse.json({ ok: true, participant: { id: participant.id, fullName: participant.fullName } });
  } catch (error) {
    console.error("[api/identity] gagal menyimpan peserta", error);
    return NextResponse.json({ ok: false, message: COPY.errors.saveFailed }, { status: 500 });
  }
}
