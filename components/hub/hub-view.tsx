"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { KangCageur } from "@/components/ui/kang-cageur";
import { BadgePill } from "@/components/ui/badge-pill";
import { COPY } from "@/lib/constants";
import { clampPercent } from "@/lib/format";
import type { CampaignProgressSummary, ParticipantSummary, QuestBadge } from "@/lib/types";

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
  activeQuestCount: number;
  earnedBadgeTitles: string[];
  nextQuestTitle: string | null;
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
    activeQuestCount,
    earnedBadgeTitles,
    nextQuestTitle,
    rankInfo,
    showNewCampaignBanner,
    transitionCampaignTitle,
    upcomingItems,
    historyCampaigns,
  } = props;

  const [tab, setTab] = useState<TabKey>("current");
  const percent = clampPercent(activeSummary.totalScore, activeSummary.maxScore || 1);
  const ctaHref =
    activeSummary.status === "completed" ? `/campaign/${activeCampaign.campaignCode}/result` : `/campaign/${activeCampaign.campaignCode}`;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <KangCageur pose="welcome" size={104} />
        <h1 className="text-lg font-extrabold text-navy-900">{COPY.appTitle}</h1>
        <p className="text-sm font-semibold text-teal-700">{COPY.hub.greeting(participantName)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <StatTile label="Campaign" value={summary.totalCampaignsJoined} />
        <StatTile label="Quest Selesai" value={summary.totalQuestsCompleted} />
        <StatTile label="Badge" value={summary.totalBadges} />
      </div>

      {transitionCampaignTitle ? (
        <Card className="flex items-center gap-3 border-2 border-gold-200 bg-gold-50 p-4">
          <Image src="/icon-campaign.svg" alt="" width={28} height={28} aria-hidden="true" />
          <p className="text-sm font-semibold text-navy-700">{COPY.hub.transitionBanner}</p>
        </Card>
      ) : null}

      {showNewCampaignBanner ? (
        <Card className="overflow-hidden border-2 border-teal-200 bg-gradient-to-br from-teal-500 to-navy-600 p-5 text-white">
          <div className="flex items-center gap-4">
            <KangCageur pose="misi-baru" size={72} />
            <div>
              <p className="text-lg font-extrabold">{COPY.hub.newCampaignBanner.title}</p>
              <p className="mt-1 text-sm text-teal-50">{COPY.hub.newCampaignBanner.text(participantName)}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <LinkButton href="/klasemen" variant="secondary" fullWidth>
        {COPY.hub.viewFullLeaderboard}
      </LinkButton>

      <nav className="flex gap-2 rounded-2xl bg-navy-100/60 p-1">
        {(["current", "upcoming", "history"] as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              tab === key ? "bg-white text-teal-700 shadow-sm" : "text-navy-500"
            }`}
          >
            {COPY.hub.tabs[key]}
          </button>
        ))}
      </nav>

      {tab === "current" ? (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Misi Aktif</p>
          <h2 className="mt-1 text-lg font-extrabold text-navy-900">{activeCampaign.title}</h2>
          {activeCampaign.description ? <p className="mt-1 text-sm text-navy-500">{activeCampaign.description}</p> : null}

          <div className="mt-4">
            <ProgressBar
              current={activeSummary.completedQuestCount}
              total={activeQuestCount}
              label={`Quest ${activeSummary.completedQuestCount} dari ${activeQuestCount} selesai`}
            />
          </div>

          <p className="mt-3 text-sm font-semibold text-navy-700">
            Skor: {activeSummary.totalScore} / {activeSummary.maxScore}
          </p>

          {rankInfo ? <p className="mt-1 text-sm text-navy-500">Ranking klasemen: #{rankInfo}</p> : null}

          {earnedBadgeTitles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {earnedBadgeTitles.map((title) => (
                <BadgePill key={title} badge={{ code: title, title } satisfies QuestBadge} />
              ))}
            </div>
          ) : null}

          {nextQuestTitle && activeSummary.status !== "completed" ? (
            <p className="mt-3 text-sm text-navy-500">
              Quest berikutnya: <span className="font-semibold text-navy-800">{nextQuestTitle}</span>
            </p>
          ) : null}

          <LinkButton href={ctaHref} fullWidth className="mt-5">
            {mainCta(activeSummary.status, showNewCampaignBanner)}
          </LinkButton>
        </Card>
      ) : null}

      {tab === "upcoming" ? (
        <div className="flex flex-col gap-3">
          {upcomingItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy-400">Belum ada misi baru yang dijadwalkan.</p>
          ) : (
            upcomingItems.map((item, index) => (
              <Card key={index} className="flex items-center gap-3 border border-navy-100 p-4 opacity-60">
                <Image src="/icon-kalender.svg" alt="" width={28} height={28} aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-navy-700">{item.title}</p>
                  {item.note ? <p className="text-xs text-navy-400">{item.note}</p> : null}
                  <p className="mt-0.5 text-xs font-bold text-gold-600">{COPY.questCardStatus.upcoming}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="flex flex-col gap-3">
          {historyCampaigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy-400">Belum ada riwayat misi.</p>
          ) : (
            historyCampaigns.map((campaign) => (
              <Card key={campaign.campaignCode} className="p-4">
                <p className="text-sm font-extrabold text-navy-900">{campaign.title}</p>
                <p className="mt-1 text-xs text-navy-500">
                  {campaign.completedQuestCount} dari {campaign.totalActiveQuests} quest selesai
                </p>
                <p className="text-xs text-navy-500">
                  Skor akhir: {campaign.totalScore}/{campaign.maxScore}
                  {campaign.rank ? ` · Ranking akhir: #${campaign.rank}` : ""}
                </p>
                <p className="text-xs text-navy-500">Badge: {campaign.badgeCount}</p>
                <Link
                  href={`/campaign/${campaign.campaignCode}/result`}
                  className="mt-3 inline-block text-xs font-bold text-teal-700 underline underline-offset-2"
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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-2 py-3">
      <p className="text-xl font-extrabold text-teal-700">{value}</p>
      <p className="text-[11px] font-semibold text-navy-500">{label}</p>
    </Card>
  );
}
