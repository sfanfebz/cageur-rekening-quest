"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sound";
import type { QuickReactionConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function QuickReactionGame({ config, onFinish }: QuestGameProps<QuickReactionConfig>) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [answeredThisRound, setAnsweredThisRound] = useState(false);
  const hitsRef = useRef<string[]>([]);
  const falseHitsRef = useRef(0);
  const finishedRef = useRef(false);

  const round = config.rounds[roundIndex];

  useEffect(() => {
    if (!round) return;
    setAnsweredThisRound(false);
    const timer = setTimeout(() => goToNextRound(), config.reactionWindowMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  function goToNextRound() {
    if (finishedRef.current) return;
    const nextIndex = roundIndex + 1;
    if (nextIndex >= config.rounds.length) {
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

  if (!round) {
    return <p className="py-10 text-center text-sm text-navy-500">Menghitung hasil…</p>;
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <p className="text-xs font-bold text-navy-400">
        Ronde {roundIndex + 1} dari {config.rounds.length}
      </p>
      <button
        type="button"
        onClick={handleTap}
        className={`flex h-40 w-40 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-lg transition active:scale-95 ${
          round.isTarget ? "bg-teal-600" : "bg-red-400"
        }`}
      >
        {round.label}
      </button>
      <p className="text-xs text-navy-400">{round.isTarget ? "Tap secepatnya!" : "Jangan tap!"}</p>
    </div>
  );
}
