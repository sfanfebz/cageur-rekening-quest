"use client";

import { useState } from "react";
import { LinkButton, Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { KangCageur } from "@/components/ui/kang-cageur";
import { BadgePill } from "@/components/ui/badge-pill";
import { IconShare } from "@/components/ui/icons";
import { COPY, resultCategory } from "@/lib/constants";
import { clampPercent } from "@/lib/format";
import type { QuestBadge } from "@/lib/types";

export interface ResultQuestRow {
  questCode: string;
  title: string;
  score: number | null;
  maxScore: number;
  badge: QuestBadge | null;
}

interface ResultViewProps {
  participantName: string;
  campaignCode: string;
  campaignTitle: string;
  totalScore: number;
  maxScore: number;
  rank: number | null;
  questRows: ResultQuestRow[];
  isCampaignArchived: boolean;
}

export function ResultView({ participantName, campaignCode, campaignTitle, totalScore, maxScore, rank, questRows, isCampaignArchived }: ResultViewProps) {
  const [shared, setShared] = useState(false);
  const percent = clampPercent(totalScore, maxScore || 1);
  const category = resultCategory(percent);
  const badges = questRows.map((row) => row.badge).filter((b): b is QuestBadge => Boolean(b));

  async function handleShare() {
    const text = `${participantName} meraih skor ${totalScore}/${maxScore} di ${campaignTitle} — ${category.label} 🎉`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: COPY.appTitle, text });
        return;
      } catch {
        // pengguna membatalkan share sheet, lanjut ke fallback salin teks
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-4 overflow-hidden pb-6 text-center">
      {!isCampaignArchived ? <Confetti count={30} /> : null}
      <h1 className="font-display text-2xl font-extrabold text-navy-900">{COPY.result.title}</h1>
      <KangCageur pose="thumbsup" size={120} />

      <span className="rounded-full bg-gold-50 px-5 py-2.5 text-sm font-extrabold text-gold-600">{category.label}</span>

      <p className="font-display text-4xl font-extrabold text-navy-900">
        {totalScore} <span className="font-sans text-base font-semibold text-gray-500">/ {maxScore} total poin</span>
      </p>

      <div className="grid w-full grid-cols-4 gap-1.5">
        {questRows.map((row, index) => (
          <div key={row.questCode} className="rounded-xl bg-white p-2 shadow-e1">
            <p className="font-display text-sm font-extrabold text-navy-900">{row.score ?? 0}</p>
            <p className="text-[9px] font-bold text-gray-500">Q{index + 1}</p>
          </div>
        ))}
      </div>

      {rank ? <p className="text-sm font-bold text-navy-900">Ranking: #{rank}</p> : null}

      {badges.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {badges.map((badge) => (
            <BadgePill key={badge.code} badge={badge} />
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex w-full flex-col gap-2">
        <LinkButton href={`/campaign/${campaignCode}/leaderboard`} fullWidth>
          {COPY.result.ctaLeaderboard}
        </LinkButton>
        <LinkButton href="/hub" variant="secondary" fullWidth>
          {COPY.result.ctaHub}
        </LinkButton>
        <Button variant="ghost" onClick={handleShare} fullWidth>
          <IconShare size={16} />
          {shared ? "Tersalin!" : COPY.result.ctaShare}
        </Button>
      </div>

      <p className="text-sm font-bold text-teal-600">{COPY.closingMessage}</p>
    </div>
  );
}
