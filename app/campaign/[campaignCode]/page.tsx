import { notFound, redirect } from "next/navigation";
import { KangCageur } from "@/components/ui/kang-cageur";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QuestListItem } from "@/components/campaign/quest-list-item";
import { COPY } from "@/lib/constants";
import { getParticipantIdFromSession } from "@/lib/session";
import { getCampaignByCode, getCampaignQuestsWithState, summarizeCampaignProgress } from "@/lib/data";

export default async function CampaignIntroPage({ params }: { params: Promise<{ campaignCode: string }> }) {
  const { campaignCode } = await params;
  const participantId = await getParticipantIdFromSession();
  if (!participantId) redirect("/");

  const campaign = await getCampaignByCode(campaignCode);
  if (!campaign || campaign.status === "draft" || campaign.status === "disabled") notFound();
  if (campaign.status === "upcoming") redirect("/hub");
  if (campaign.status === "archived") redirect(`/campaign/${campaignCode}/result`);

  const questStates = await getCampaignQuestsWithState(campaign, participantId);
  const summary = summarizeCampaignProgress(questStates);
  if (summary.status === "completed") redirect(`/campaign/${campaignCode}/result`);

  const activeQuestCount = questStates.filter((q) => q.quest.status === "active").length;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <KangCageur pose="map" size={112} />
        <h1 className="font-display text-2xl font-extrabold text-navy-900">{campaign.title}</h1>
        {campaign.description ? <p className="text-sm text-gray-600">{campaign.description}</p> : null}
      </div>

      <ProgressBar
        current={summary.completedQuestCount}
        total={activeQuestCount}
        label={`Quest ${summary.completedQuestCount} dari ${activeQuestCount} selesai`}
      />

      <div className="flex flex-col gap-3">
        {questStates
          .filter((q) => q.quest.status !== "archived")
          .map((questState, index) => (
            <QuestListItem key={questState.quest.id} questState={questState} campaignCode={campaignCode} index={index} />
          ))}
      </div>

      <p className="text-center text-xs text-gray-500">{COPY.privacyNotice}</p>
    </div>
  );
}
