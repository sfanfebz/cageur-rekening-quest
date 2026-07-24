import { NextResponse } from "next/server";
import { questStartSchema } from "@/lib/validators";
import { getParticipantIdFromSession } from "@/lib/session";
import { getActiveCampaign, getCampaignByCode, getCampaignQuestsWithState, getQuestByCode, startQuestProgress } from "@/lib/data";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  const participantId = await getParticipantIdFromSession();
  if (!participantId) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 401 });
  }

  const parsed = questStartSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  const campaign =
    (await getCampaignByCode(parsed.data.campaignCode)) ?? (await getActiveCampaign());
  if (!campaign || campaign.status !== "active") {
    return NextResponse.json({ ok: false, message: COPY.errors.noActiveCampaign }, { status: 409 });
  }

  const quest = await getQuestByCode(parsed.data.questCode);
  if (!quest || quest.status !== "active") {
    return NextResponse.json({ ok: false, message: COPY.errors.generic }, { status: 404 });
  }

  const questStates = await getCampaignQuestsWithState(campaign, participantId);
  const state = questStates.find((q) => q.quest.id === quest.id);
  if (!state || (state.uiStatus !== "available" && state.uiStatus !== "started")) {
    return NextResponse.json({ ok: false, message: "Misi ini belum bisa dimainkan." }, { status: 403 });
  }

  await startQuestProgress(participantId, campaign.id, quest);
  return NextResponse.json({ ok: true });
}
