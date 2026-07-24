import { NextResponse } from "next/server";
import { passcodeSchema } from "@/lib/validators";
import { env } from "@/lib/env";
import { getActiveCampaign, getFullLeaderboard } from "@/lib/data";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  const parsed = passcodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  // Passcode divalidasi di server terhadap environment variable Vercel,
  // tidak pernah ditulis di kode frontend (bagian 20B.1).
  if (parsed.data.passcode !== env.leaderboardPasscode) {
    return NextResponse.json({ ok: false, message: COPY.errors.wrongPasscode }, { status: 401 });
  }

  const campaign = await getActiveCampaign();
  if (!campaign) {
    return NextResponse.json({ ok: false, message: COPY.errors.noActiveCampaign }, { status: 404 });
  }

  const rows = await getFullLeaderboard(campaign.id);
  return NextResponse.json({ ok: true, campaignTitle: campaign.title, rows });
}
