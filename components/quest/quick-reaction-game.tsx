"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sound";
import { useShuffled } from "@/lib/shuffle";
import { InstructionGate } from "@/components/quest/instruction-gate";
import type { QuickReactionConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function QuickReactionGame({ config, onFinish }: QuestGameProps<QuickReactionConfig>) {
  const rounds = useShuffled(config.rounds);
  const [started, setStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [answeredThisRound, setAnsweredThisRound] = useState(false);
  const hitsRef = useRef<string[]>([]);
  const falseHitsRef = useRef(0);
  const finishedRef = useRef(false);

  const round = rounds[roundIndex];

  useEffect(() => {
    if (!started || !round) return;
    setAnsweredThisRound(false);
    const timer = setTimeout(() => goToNextRound(), config.reactionWindowMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, started]);

  function goToNextRound() {
    if (finishedRef.current) return;
    const nextIndex = roundIndex + 1;
    if (nextIndex >= rounds.length) {
      finishedRef.current = true;
      onFinish({ hits: hitsRef.current, falseHits: falseHitsRef.current });
      return;
    }
    setRoundIndex(nextIndex);
  }

  function handleTap() {
    if (answeredThisRound || !round) return;
    setAnsweredThisRound(true);
    if (round.isTarget) {
      hitsRef.current = [...hitsRef.current, round.id];
      sfx.pop();
    } else {
      falseHitsRef.current += 1;
      sfx.error();
    }
    setTimeout(() => goToNextRound(), 180);
  }

  if (!started) {
    return <InstructionGate instruction={config.instruction} onConfirm={() => setStarted(true)} />;
  }

  if (!round) {
    return <p className="py-10 text-center text-sm text-navy-500">Menghitung hasil…</p>;
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <p className="text-xs font-bold text-navy-400">
        Ronde {roundIndex + 1} dari {rounds.length}
      </p>
      <button
        type="button"
        onClick={handleTap}
        className={`flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-full text-base font-extrabold text-white shadow-lg transition active:scale-95 ${
          round.isTarget
            ? "animate-glow-pulse bg-gradient-to-br from-teal-400 to-teal-700"
            : "bg-gradient-to-br from-red-400 to-red-600"
        }`}
      >
        <span className="text-4xl leading-none">{round.emoji ?? (round.isTarget ? "💰" : "⚠️")}</span>
        {round.label}
      </button>
      <p className="text-xs text-navy-400">{round.isTarget ? "Tap secepatnya!" : "Jangan tap!"}</p>
    </div>
  );
}
