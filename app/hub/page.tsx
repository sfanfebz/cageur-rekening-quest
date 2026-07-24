import { redirect } from "next/navigation";
import { HubView, type HistoryCampaignData } from "@/components/hub/hub-view";
import { ErrorBanner } from "@/components/ui/error-banner";
import { KangCageur } from "@/components/ui/kang-cageur";
import { COPY } from "@/lib/constants";
import { getParticipantIdFromSession } from "@/lib/session";
import {
  ensureParticipantCampaignProgress,
  findStartedArchivedCampaign,
  getActiveCampaign,
  getArchivedParticipatedCampaigns,
  getCampaignQuestsWithState,
  getParticipantById,
  getParticipantRankInCampaign,
  getParticipantSummary,
  getUpcomingCampaigns,
  summarizeCampaignProgress,
} from "@/lib/data";

export default async function HubPage() {
  const participantId = await getParticipantIdFromSession();
  if (!participantId) redirect("/");

  const participant = await getParticipantById(participantId);
  if (!participant) redirect("/");

  const [activeCampaign, upcomingCampaigns, archivedCampaigns, summary] = await Promise.all([
    getActiveCampaign(),
    getUpcomingCampaigns(),
    getArchivedParticipatedCampaigns(participantId),
    getParticipantSummary(participantId),
  ]);

  const historyCampaigns: HistoryCampaignData[] = await Promise.all(
    archivedCampaigns.map(async (campaign) => {
      const questStates = await getCampaignQuestsWithState(campaign, participantId);
      const questSummary = summarizeCampaignProgress(questStates);
      const rank = await getParticipantRankInCampaign(campaign.id, participantId);
      return {
        campaignCode: campaign.campaignCode,
        title: campaign.title,
        completedQuestCount: questSummary.completedQuestCount,
        totalActiveQuests: questStates.filter((q) => q.quest.status === "active").length,
        totalScore: questSummary.totalScore,
        maxScore: questSummary.maxScore,
        badgeCount: questStates.filter((q) => q.uiStatus === "completed" && q.badge).length,
        rank,
      };
    })
  );

  const hasCompletedHistory = historyCampaigns.length > 0;

  if (!activeCampaign) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <KangCageur pose="welcome" size={120} />
        <ErrorBanner message={COPY.errors.noActiveCampaign} />
      </div>
    );
  }

  await ensureParticipantCampaignProgress(participant.id, activeCampaign.id);
  const activeQuestStates = await getCampaignQuestsWithState(activeCampaign, participantId);
  const activeSummary = summarizeCampaignProgress(activeQuestStates);
  const rankInfo =
    activeSummary.status === "completed" ? await getParticipantRankInCampaign(activeCampaign.id, participantId) : null;

  const transitionCampaign = await findStartedArchivedCampaign(participantId, activeCampaign.id);
  const showNewCampaignBanner = hasCompletedHistory && activeSummary.status === "not_started";

  const upcomingQuestTitles = activeQuestStates
    .filter((q) => q.uiStatus === "upcoming")
    .map((q) => ({ title: q.quest.title, note: q.quest.subtitle }));
  const upcomingItems = [
    ...upcomingCampaigns.map((c) => ({ title: c.title, note: c.description })),
    ...upcomingQuestTitles,
  ];

  return (
    <HubView
      participantName={participant.fullName}
      summary={summary}
      activeCampaign={{
        campaignCode: activeCampaign.campaignCode,
        title: activeCampaign.title,
        description: activeCampaign.description,
      }}
      activeSummary={activeSummary}
      activeQuestStates={activeQuestStates}
      activeQuestCount={activeQuestStates.filter((q) => q.quest.status === "active").length}
      earnedBadgeTitles={activeQuestStates.filter((q) => q.uiStatus === "completed" && q.badge).map((q) => q.badge!.title)}
      nextQuestTitle={
        activeQuestStates.find((q) => q.uiStatus === "started")?.quest.title ??
        activeQuestStates.find((q) => q.uiStatus === "available")?.quest.title ??
        null
      }
      rankInfo={rankInfo}
      showNewCampaignBanner={showNewCampaignBanner}
      transitionCampaignTitle={transitionCampaign?.title ?? null}
      upcomingItems={upcomingItems}
      historyCampaigns={historyCampaigns}
    />
  );
}
