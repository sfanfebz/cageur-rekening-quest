import { notFound, redirect } from "next/navigation";
import { QuestRunner } from "@/components/quest/quest-runner";
import { getParticipantIdFromSession } from "@/lib/session";
import {
  getCampaignByCode,
  getCampaignQuestsWithState,
  getQuestByCode,
  startQuestProgress,
} from "@/lib/data";
import { isKnownQuestType, validateQuestConfig } from "@/lib/quest-config-schemas";

export default async function QuestPage({
  params,
}: {
  params: Promise<{ campaignCode: string; questCode: string }>;
}) {
  const { campaignCode, questCode } = await params;
  const participantId = await getParticipantIdFromSession();
  if (!participantId) redirect("/");

  const campaign = await getCampaignByCode(campaignCode);
  if (!campaign || campaign.status !== "active") redirect("/hub");

  const quest = await getQuestByCode(questCode);
  if (!quest || quest.status !== "active" || !isKnownQuestType(quest.questType)) notFound();

  const configResult = validateQuestConfig(quest.questType, quest.configJson);
  if (!configResult.success) notFound();

  const questStates = await getCampaignQuestsWithState(campaign, participantId);
  const state = questStates.find((q) => q.quest.id === quest.id);
  if (!state) notFound();
  if (state.uiStatus === "completed" || state.uiStatus === "upcoming") redirect(`/campaign/${campaignCode}`);
  if (state.uiStatus === "locked") redirect(`/campaign/${campaignCode}`);

  await startQuestProgress(participantId, campaign.id, quest);

  return (
    <QuestRunner
      campaignCode={campaignCode}
      questCode={questCode}
      questType={quest.questType}
      title={quest.title}
      subtitle={quest.subtitle}
      config={configResult.data}
      maxScore={quest.maxScore}
    />
  );
}
