"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackLayer, type FeedbackItem } from "@/components/ui/feedback-toast";
import { sfx } from "@/lib/sound";
import { cardTone } from "@/lib/card-palette";
import type { TapSelectConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function TapSelectGame({ config, onFinish }: QuestGameProps<TapSelectConfig>) {
  const [answered, setAnswered] = useState<Record<string, "correct" | "wrong">>({});
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  let feedbackId = 0;

  function pushFeedback(text: string, tone: FeedbackItem["tone"]) {
    feedbackId += 1;
    const id = Date.now() + feedbackId;
    setFeedback((prev) => [...prev, { id, text, tone }]);
  }

  function handleTap(cardId: string, healthy: boolean) {
    if (answered[cardId]) return;
    if (healthy) {
      setAnswered((prev) => ({ ...prev, [cardId]: "correct" }));
      sfx.ding();
      pushFeedback("DING!", "success");
    } else {
      setAnswered((prev) => ({ ...prev, [cardId]: "wrong" }));
      sfx.error();
      setShakingId(cardId);
      pushFeedback("CEK DEUI!", "error");
      setTimeout(() => setShakingId(null), 400);
    }
  }

  const answeredCount = Object.keys(answered).length;
  const healthyIds = config.cards.filter((c) => c.healthy).map((c) => c.id);
  const correctFound = healthyIds.filter((id) => answered[id] === "correct").length;
  const allHealthyFound = correctFound === healthyIds.length;

  return (
    <div className="relative flex flex-col gap-4">
      <FeedbackLayer items={feedback} onDone={(id) => setFeedback((prev) => prev.filter((f) => f.id !== id))} />
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {config.cards.map((card, index) => {
          const state = answered[card.id];
          const tone = cardTone(index);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleTap(card.id, card.healthy)}
              disabled={Boolean(state)}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center text-xs font-bold transition-all ${
                state === "correct"
                  ? "animate-glow-pulse border-teal-500 bg-teal-100 text-teal-800"
                  : state === "wrong"
                    ? "border-red-300 bg-red-50 text-red-500 opacity-60"
                    : `${tone.border} ${tone.bg} ${tone.text} shadow-sm active:scale-95`
              } ${shakingId === card.id ? "animate-shake" : ""}`}
            >
              {state === "correct" ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-black text-white shadow">
                  ✓
                </span>
              ) : null}
              <span className="text-2xl leading-none">{card.emoji ?? "🃏"}</span>
              <span className="leading-snug">{card.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-navy-400">
        {correctFound}/{healthyIds.length} kebiasaan sehat ditemukan · {answeredCount}/{config.cards.length} kartu di-cek
      </p>
      <Button disabled={!allHealthyFound} onClick={() => onFinish({ selectedIds: Object.keys(answered) })} fullWidth>
        Selesai
      </Button>
    </div>
  );
}
