"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LinkButton, Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { KangCageur } from "@/components/ui/kang-cageur";
import { BadgePill } from "@/components/ui/badge-pill";
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
    <div className="relative flex flex-col gap-5 pb-6">
      {!isCampaignArchived ? <Confetti count={30} /> : null}
      <div className="flex flex-col items-center gap-2 text-center">
        <KangCageur pose="thumbsup" size={128} />
        <h1 className="text-xl font-extrabold text-navy-900">{COPY.result.title}</h1>
        <p className="text-sm font-semibold text-navy-500">{campaignTitle}</p>
      </div>

      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <p className="text-4xl font-extrabold text-teal-700">
          {totalScore}
          <span className="text-lg font-semibold text-navy-400"> / {maxScore}</span>
        </p>
        <p className="text-lg font-extrabold text-navy-900">{category.label}</p>
        {rank ? <p className="text-sm text-navy-500">Ranking campaign: #{rank}</p> : null}
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-navy-700">Skor per Quest</p>
        {questRows.map((row) => (
          <Card key={row.questCode} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-semibold text-navy-800">{row.title}</p>
              {row.badge ? <div className="mt-1"><BadgePill badge={row.badge} /></div> : null}
            </div>
            <p className="text-sm font-extrabold text-navy-700">
              {row.score ?? 0}/{row.maxScore}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <LinkButton href={`/campaign/${campaignCode}/leaderboard`} fullWidth>
          {COPY.result.ctaLeaderboard}
        </LinkButton>
        <LinkButton href="/hub" variant="secondary" fullWidth>
          {COPY.result.ctaHub}
        </LinkButton>
        <Button variant="ghost" onClick={handleShare} fullWidth>
          {shared ? "Tersalin!" : COPY.result.ctaShare}
        </Button>
      </div>

      <p className="text-center text-sm font-semibold text-teal-700">{COPY.closingMessage}</p>
    </div>
  );
}
