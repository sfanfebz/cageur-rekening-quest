"use client";

import { useEffect, useState } from "react";
import { LinkButton, Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { KangCageur } from "@/components/ui/kang-cageur";
import { BadgePill } from "@/components/ui/badge-pill";
import { Modal } from "@/components/ui/modal";
import { IconShare } from "@/components/ui/icons";
import { COPY, resultCategory, APP_URL } from "@/lib/constants";
import { clampPercent } from "@/lib/format";
import { generateShareCardBlob } from "@/lib/share-card";
import { useBgm } from "@/lib/bgm-engine";
import { CAMPAIGN_FINALE_TRACK } from "@/lib/bgm-tracks";
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
  const [previewStatus, setPreviewStatus] = useState<"idle" | "generating">("idle");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "done">("idle");
  useBgm(CAMPAIGN_FINALE_TRACK);
  const percent = clampPercent(totalScore, maxScore || 1);
  const category = resultCategory(percent);
  const badges = questRows.map((row) => row.badge).filter((b): b is QuestBadge => Boolean(b));

  // Bersihkan object URL preview begitu modal ditutup / komponen unmount,
  // supaya tidak bocor memori.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleOpenPreview() {
    setPreviewStatus("generating");
    try {
      const blob = await generateShareCardBlob({
        campaignTitle,
        participantName,
        score: totalScore,
        maxScore,
        questCount: questRows.length,
        badgeTitles: badges.map((b) => b.title),
        rank,
        categoryLabel: category.label,
      });
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } finally {
      setPreviewStatus("idle");
    }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setShareStatus("idle");
  }

  async function handleConfirmShare() {
    if (!previewBlob) return;
    setShareStatus("sharing");
    const text = `Saya berhasil mendapatkan skor ${totalScore} pada campaign ${campaignTitle} di Cageur Rekening Quest. Yuk ikutan main di ${APP_URL}`;

    try {
      const file = new File([previewBlob], "hasil-cageur-rekening-quest.png", { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: COPY.appTitle, text, files: [file] });
          closePreview();
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") {
            setShareStatus("idle");
            return;
          }
          // gagal share native, lanjut ke fallback unduh di bawah
        }
      }

      const url = URL.createObjectURL(previewBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hasil-cageur-rekening-quest.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text).catch(() => {});
      }
      setShareStatus("done");
      setTimeout(() => closePreview(), 1500);
    } catch {
      setShareStatus("idle");
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
        <Button variant="ghost" onClick={handleOpenPreview} loading={previewStatus === "generating"} fullWidth>
          {previewStatus !== "generating" ? <IconShare size={16} /> : null}
          {previewStatus === "generating" ? "Menyiapkan kartu…" : COPY.result.ctaShare}
        </Button>
      </div>

      <p className="text-sm font-bold text-teal-600">{COPY.closingMessage}</p>

      <Modal open={previewUrl !== null} onClose={closePreview} title="Preview Kartu Hasil">
        <div className="flex flex-col gap-4">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview kartu hasil" className="w-full rounded-2xl ring-1 ring-gray-200" />
          ) : null}
          <Button onClick={handleConfirmShare} loading={shareStatus === "sharing"} fullWidth>
            {shareStatus !== "sharing" ? <IconShare size={16} /> : null}
            {shareStatus === "sharing" ? "Membagikan…" : shareStatus === "done" ? "Gambar diunduh!" : "Bagikan Sekarang"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
