"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackLayer, type FeedbackItem } from "@/components/ui/feedback-toast";
import { sfx } from "@/lib/sound";
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
  const allAnswered = answeredCount === config.cards.length;

  return (
    <div className="relative flex flex-col gap-4">
      <FeedbackLayer items={feedback} onDone={(id) => setFeedback((prev) => prev.filter((f) => f.id !== id))} />
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {config.cards.map((card) => {
          const state = answered[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleTap(card.id, card.healthy)}
              disabled={Boolean(state)}
              className={`rounded-2xl border-2 p-3 text-left text-sm font-semibold transition-all ${
                state === "correct"
                  ? "animate-glow-pulse border-teal-500 bg-teal-50 text-teal-800"
                  : state === "wrong"
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-navy-100 bg-white text-navy-700 active:scale-95"
              } ${shakingId === card.id ? "animate-shake" : ""}`}
            >
              {state === "correct" ? "✅ " : null}
              {card.label}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-navy-400">{answeredCount}/{config.cards.length} kartu di-cek</p>
      <Button disabled={!allAnswered} onClick={() => onFinish({ selectedIds: Object.keys(answered) })} fullWidth>
        Selesai
      </Button>
    </div>
  );
}
