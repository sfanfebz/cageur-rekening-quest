"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { KangCageur } from "@/components/ui/kang-cageur";
import { BadgePill } from "@/components/ui/badge-pill";
import { IconCampaign, IconKalender } from "@/components/ui/icons";
import { QuestListItem } from "@/components/campaign/quest-list-item";
import { COPY } from "@/lib/constants";
import { clampPercent } from "@/lib/format";
import type { CampaignProgressSummary, ParticipantSummary, QuestBadge, QuestWithState } from "@/lib/types";

export interface HistoryCampaignData {
  campaignCode: string;
  title: string;
  completedQuestCount: number;
  totalActiveQuests: number;
  totalScore: number;
  maxScore: number;
  badgeCount: number;
  rank: number | null;
}

interface HubViewProps {
  participantName: string;
  summary: ParticipantSummary;
  activeCampaign: { campaignCode: string; title: string; description: string | null };
  activeSummary: CampaignProgressSummary;
  activeQuestStates: QuestWithState[];
  activeQuestCount: number;
  earnedBadgeTitles: string[];
  nextQuestTitle: string | null;
  nextQuestCode: string | null;
  rankInfo: number | null;
  showNewCampaignBanner: boolean;
  transitionCampaignTitle: string | null;
  upcomingItems: Array<{ title: string; note?: string | null }>;
  historyCampaigns: HistoryCampaignData[];
}

type TabKey = "current" | "upcoming" | "history";

function mainCta(status: CampaignProgressSummary["status"], hasHistory: boolean) {
  if (status === "completed") return COPY.questCta.viewResult;
  if (status === "started") return COPY.questCta.resume;
  return hasHistory ? COPY.questCta.startNewCampaign : COPY.questCta.start;
}

export function HubView(props: HubViewProps) {
  const {
    participantName,
    summary,
    activeCampaign,
    activeSummary,
    activeQuestStates,
    activeQuestCount,
    earnedBadgeTitles,
    nextQuestTitle,
    nextQuestCode,
    rankInfo,
    showNewCampaignBanner,
    transitionCampaignTitle,
    upcomingItems,
    historyCampaigns,
  } = props;

  const [tab, setTab] = useState<TabKey>("current");
  const ctaHref =
    activeSummary.status === "completed"
      ? `/campaign/${activeCampaign.campaignCode}/result`
      : nextQuestCode
        ? `/campaign/${activeCampaign.campaignCode}/quest/${nextQuestCode}`
        : `/campaign/${activeCampaign.campaignCode}`;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <KangCageur pose="welcome" size={104} />
        <h1 className="font-display text-xl font-extrabold text-navy-900">{COPY.appTitle}</h1>
        <p className="text-sm font-bold text-teal-600">{COPY.hub.greeting(participantName)}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <StatTile label="Campaign" value={summary.totalCampaignsJoined} />
        <StatTile label="Quest Selesai" value={summary.totalQuestsCompleted} valueClassName="text-teal-500" />
        <StatTile label="Badge" value={summary.totalBadges} valueClassName="text-gold-400" />
        <StatTile label="Klasemen" value={rankInfo ? `#${rankInfo}` : "-"} valueClassName="text-green-500" />
      </div>

      {transitionCampaignTitle ? (
        <Card className="flex items-center gap-3 bg-gold-50 p-4">
          <IconCampaign size={26} className="shrink-0 text-gold-600" />
          <p className="text-sm font-semibold text-navy-700">{COPY.hub.transitionBanner}</p>
        </Card>
      ) : null}

      {showNewCampaignBanner ? (
        <div className="animate-bounce-in overflow-hidden rounded-[22px] bg-gradient-to-br from-teal-400 to-teal-500 p-5 text-center text-white shadow-e3">
          <p className="font-display text-lg font-extrabold">{COPY.hub.newCampaignBanner.title}</p>
          <div className="my-3 flex items-center justify-center rounded-2xl bg-white/15 py-2">
            <KangCageur pose="misi-baru" size={88} />
          </div>
          <p className="text-sm text-teal-50">{COPY.hub.newCampaignBanner.text(participantName)}</p>
        </div>
      ) : null}

      <LinkButton href="/klasemen" variant="secondary" fullWidth>
        {COPY.hub.viewFullLeaderboard}
      </LinkButton>

      <nav className="flex gap-1.5 rounded-full bg-gray-100 p-1">
        {(["current", "upcoming", "history"] as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-full py-2 text-xs font-extrabold transition ${
              tab === key ? "bg-teal-500 text-white shadow-e1" : "text-gray-600"
            }`}
          >
            {COPY.hub.tabs[key]}
          </button>
        ))}
      </nav>

      {tab === "current" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-[20px] bg-gradient-to-br from-teal-400 to-teal-500 p-[18px] text-white shadow-e2">
            <p className="font-display text-base font-extrabold">{activeCampaign.title}</p>
            {activeCampaign.description ? <p className="mt-1 text-xs text-teal-50/90">{activeCampaign.description}</p> : null}

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-teal-50">
                <span>
                  Quest {activeSummary.completedQuestCount} dari {activeQuestCount}
                </span>
                <span>
                  {activeSummary.totalScore}/{activeSummary.maxScore}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
                  style={{ width: `${clampPercent(activeSummary.completedQuestCount, activeQuestCount || 1)}%` }}
                />
              </div>
            </div>

            {earnedBadgeTitles.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {earnedBadgeTitles.map((title) => (
                  <BadgePill key={title} badge={{ code: title, title } satisfies QuestBadge} />
                ))}
              </div>
            ) : null}

            {nextQuestTitle && activeSummary.status !== "completed" ? (
              <p className="mt-3 text-xs text-teal-50">
                Quest berikutnya: <span className="font-bold text-white">{nextQuestTitle}</span>
              </p>
            ) : null}

            <LinkButton href={ctaHref} className="mt-4 !bg-none !bg-white !text-teal-600 !shadow-none hover:!bg-teal-50" fullWidth>
              {mainCta(activeSummary.status, showNewCampaignBanner)}
            </LinkButton>
          </div>

          <div className="flex flex-col gap-2">
            {activeQuestStates
              .filter((q) => q.quest.status !== "archived")
              .map((questState, index) => (
                <QuestListItem
                  key={questState.quest.id}
                  questState={questState}
                  campaignCode={activeCampaign.campaignCode}
                  index={index}
                />
              ))}
          </div>
        </div>
      ) : null}

      {tab === "upcoming" ? (
        <div className="flex flex-col gap-3">
          {upcomingItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Belum ada misi baru yang dijadwalkan.</p>
          ) : (
            upcomingItems.map((item, index) => (
              <Card key={index} className="flex items-center gap-3 bg-gray-100 p-4 opacity-75">
                <IconKalender size={26} className="shrink-0 text-gray-500" />
                <div>
                  <p className="text-sm font-bold text-gray-600">✨ {item.title}</p>
                  {item.note ? <p className="text-xs text-gray-500">{item.note}</p> : null}
                  <p className="mt-0.5 text-xs font-bold text-gray-500">{COPY.questCardStatus.upcoming}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="flex flex-col gap-3">
          {historyCampaigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Belum ada riwayat misi.</p>
          ) : (
            historyCampaigns.map((campaign) => (
              <Card key={campaign.campaignCode} className="p-4">
                <p className="font-display text-sm font-extrabold text-navy-900">{campaign.title}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {campaign.completedQuestCount} dari {campaign.totalActiveQuests} quest selesai
                </p>
                <p className="text-xs text-gray-600">
                  Skor akhir: {campaign.totalScore}/{campaign.maxScore}
                  {campaign.rank ? ` · Ranking akhir: #${campaign.rank}` : ""}
                </p>
                <p className="text-xs text-gray-600">Badge: {campaign.badgeCount}</p>
                <Link
                  href={`/campaign/${campaign.campaignCode}/result`}
                  className="mt-3 inline-block text-xs font-bold text-teal-600 underline underline-offset-2"
                >
                  Lihat Detail
                </Link>
              </Card>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatTile({ label, value, valueClassName = "text-navy-900" }: { label: string; value: number | string; valueClassName?: string }) {
  return (
    <Card className="px-1.5 py-2.5 shadow-none">
      <p className={`font-display text-base font-extrabold ${valueClassName}`}>{value}</p>
      <p className="text-[9px] font-bold text-gray-600">{label}</p>
    </Card>
  );
}
