import { notFound, redirect } from "next/navigation";
import { ResultView, type ResultQuestRow } from "@/components/campaign/result-view";
import { getParticipantIdFromSession } from "@/lib/session";
import {
  getCampaignByCode,
  getCampaignQuestsWithState,
  getParticipantById,
  getParticipantRankInCampaign,
  summarizeCampaignProgress,
} from "@/lib/data";

export default async function CampaignResultPage({ params }: { params: Promise<{ campaignCode: string }> }) {
  const { campaignCode } = await params;
  const participantId = await getParticipantIdFromSession();
  if (!participantId) redirect("/");

  const participant = await getParticipantById(participantId);
  if (!participant) redirect("/");

  const campaign = await getCampaignByCode(campaignCode);
  if (!campaign) notFound();

  const questStates = await getCampaignQuestsWithState(campaign, participantId);
  const summary = summarizeCampaignProgress(questStates);

  if (campaign.status === "active" && summary.status !== "completed") {
    redirect(`/campaign/${campaignCode}`);
  }

  const rank = summary.status === "completed" ? await getParticipantRankInCampaign(campaign.id, participantId) : null;

  const questRows: ResultQuestRow[] = questStates
    .filter((q) => q.quest.status === "active" || q.uiStatus === "completed")
    .map((q) => ({
      questCode: q.quest.questCode,
      title: q.quest.title,
      score: q.progress?.score ?? null,
      maxScore: q.quest.maxScore,
      badge: q.uiStatus === "completed" ? q.badge : null,
    }));

  return (
    <ResultView
      participantName={participant.fullName}
      campaignCode={campaignCode}
      campaignTitle={campaign.title}
      totalScore={summary.totalScore}
      maxScore={summary.maxScore}
      rank={rank}
      questRows={questRows}
      isCampaignArchived={campaign.status === "archived"}
    />
  );
}
