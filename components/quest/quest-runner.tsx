"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Confetti } from "@/components/ui/confetti";
import { KangCageur } from "@/components/ui/kang-cageur";
import { LoadingKang } from "@/components/ui/loading-kang";
import { BadgePill } from "@/components/ui/badge-pill";
import { getQuestComponent } from "@/components/quest/registry";
import { COPY } from "@/lib/constants";
import { sfx } from "@/lib/sound";
import { useBgm } from "@/lib/bgm-engine";
import { QUEST_TRACKS, QUEST_RESULT_TRACK } from "@/lib/bgm-tracks";
import type { QuestType } from "@/lib/types";

interface QuestRunnerProps {
  campaignCode: string;
  questCode: string;
  questType: QuestType;
  title: string;
  subtitle: string | null;
  config: unknown;
  maxScore: number;
}

type Phase = "playing" | "submitting" | "result" | "error";

interface ResultData {
  score: number;
  maxScore: number;
  badge: { code: string; title: string } | null;
  campaignStatus: "not_started" | "started" | "completed";
  alreadyCompleted: boolean;
}

export function QuestRunner({ campaignCode, questCode, questType, title, subtitle, config, maxScore }: QuestRunnerProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("playing");
  const [pendingAnswer, setPendingAnswer] = useState<unknown>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useBgm(phase === "result" ? QUEST_RESULT_TRACK : QUEST_TRACKS[questType]);

  async function submitAnswer(answer: unknown) {
    setPendingAnswer(answer);
    setPhase("submitting");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/quest/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignCode, questCode, answer }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        setErrorMessage(body.message || COPY.errors.saveFailed);
        setPhase("error");
        return;
      }
      setResult(body as ResultData);
      setPhase("result");
      if ((body.score / (body.maxScore || 1)) >= 0.6) sfx.victory();
      if (body.badge) sfx.badge();
    } catch {
      setErrorMessage(COPY.errors.saveFailed);
      setPhase("error");
    }
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-4 py-8">
        <ErrorBanner message={errorMessage ?? COPY.errors.saveFailed} />
        <Button onClick={() => submitAnswer(pendingAnswer)} fullWidth>
          Simpan Lagi
        </Button>
      </div>
    );
  }

  if (phase === "submitting") {
    return <LoadingKang message="Menyimpan hasil…" />;
  }

  if (phase === "result" && result) {
    const percent = Math.round((result.score / (result.maxScore || 1)) * 100);
    const nextHref =
      result.campaignStatus === "completed" ? `/campaign/${campaignCode}/result` : `/campaign/${campaignCode}`;
    return (
      <div className="relative flex flex-col items-center gap-4 py-8 text-center">
        <Confetti />
        <KangCageur pose="thumbsup" size={120} />
        <h2 className="font-display text-xl font-extrabold text-navy-900">Quest Beres! ✅</h2>
        <p className="animate-pop-in font-display text-4xl font-extrabold text-teal-600">
          {result.score} <span className="font-sans text-base font-semibold text-gray-500">/ {result.maxScore}</span>
        </p>
        <p className="text-sm text-gray-600">{percent}% terkumpul dari quest ini</p>
        {result.badge ? (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-gold-700">Badge Diperoleh</p>
            <BadgePill badge={result.badge} />
          </div>
        ) : null}
        <LinkButton href={nextHref} fullWidth>
          {result.campaignStatus === "completed" ? COPY.questCta.viewResult : "Lanjut"}
        </LinkButton>
      </div>
    );
  }

  const GameComponent = getQuestComponent(questType);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Quest</p>
        <h1 className="font-display text-xl font-extrabold text-navy-900">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      <Card className="p-4">
        <GameComponent config={config as never} maxScore={maxScore} onFinish={submitAnswer} />
      </Card>
    </div>
  );
}
