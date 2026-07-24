import { NextResponse } from "next/server";
import { questCompleteSchema } from "@/lib/validators";
import { getParticipantIdFromSession } from "@/lib/session";
import {
  getCampaignByCode,
  getCampaignQuestsWithState,
  getQuestByCode,
  recomputeAndSaveCampaignProgress,
  saveQuestCompletion,
} from "@/lib/data";
import { validateQuestConfig, isKnownQuestType } from "@/lib/quest-config-schemas";
import { scoreQuestAnswer } from "@/lib/scoring";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  const participantId = await getParticipantIdFromSession();
  if (!participantId) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 401 });
  }

  const parsed = questCompleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  try {
    const campaign = await getCampaignByCode(parsed.data.campaignCode);
    if (!campaign || campaign.status !== "active") {
      return NextResponse.json({ ok: false, message: COPY.errors.noActiveCampaign }, { status: 409 });
    }

    const quest = await getQuestByCode(parsed.data.questCode);
    if (!quest || quest.status !== "active" || !isKnownQuestType(quest.questType)) {
      return NextResponse.json({ ok: false, message: COPY.errors.generic }, { status: 404 });
    }

    const questStates = await getCampaignQuestsWithState(campaign, participantId);
    const state = questStates.find((q) => q.quest.id === quest.id);
    if (!state || (state.uiStatus !== "available" && state.uiStatus !== "started")) {
      if (state?.uiStatus === "completed") {
        return NextResponse.json({
          ok: true,
          alreadyCompleted: true,
          score: state.progress?.score ?? 0,
          maxScore: quest.maxScore,
        });
      }
      return NextResponse.json({ ok: false, message: "Misi ini belum bisa diselesaikan." }, { status: 403 });
    }

    const configResult = validateQuestConfig(quest.questType, quest.configJson);
    if (!configResult.success) {
      return NextResponse.json({ ok: false, message: COPY.errors.generic }, { status: 500 });
    }

    const { score } = scoreQuestAnswer(quest.questType, configResult.data, parsed.data.answer, quest.maxScore);
    const { alreadyCompleted } = await saveQuestCompletion(participantId, campaign.id, quest, score, parsed.data.answer);
    const campaignSummary = await recomputeAndSaveCampaignProgress(participantId, campaign);

    const badge = (configResult.data as { badge?: { code: string; title: string } }).badge ?? null;

    return NextResponse.json({
      ok: true,
      alreadyCompleted,
      score,
      maxScore: quest.maxScore,
      badge,
      campaignStatus: campaignSummary.status,
    });
  } catch (error) {
    console.error("[api/quest/complete] gagal menyimpan skor", error);
    return NextResponse.json({ ok: false, message: COPY.errors.saveFailed }, { status: 500 });
  }
}
