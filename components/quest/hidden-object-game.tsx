"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FeedbackLayer, type FeedbackItem } from "@/components/ui/feedback-toast";
import { TimerRing } from "@/components/ui/timer-ring";
import { sfx } from "@/lib/sound";
import type { HiddenObjectConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function HiddenObjectGame({ config, onFinish }: QuestGameProps<HiddenObjectConfig>) {
  const chips = useMemo(
    () =>
      shuffle([
        ...config.targets.map((t) => ({ ...t, isTarget: true as const })),
        ...config.decoys.map((d) => ({ ...d, isTarget: false as const })),
      ]),
    [config]
  );

  const [secondsLeft, setSecondsLeft] = useState(config.timeLimitSeconds);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [wrongTaps, setWrongTaps] = useState(0);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish({ foundIds: Array.from(foundIds), wrongTaps });
  }

  useEffect(() => {
    if (secondsLeft <= 0) {
      finish();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    if (foundIds.size === config.targets.length && config.targets.length > 0) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundIds]);

  function pushFeedback(text: string, tone: FeedbackItem["tone"]) {
    setFeedback((prev) => [...prev, { id: Date.now() + Math.random(), text, tone }]);
  }

  function handleTap(chipId: string, isTarget: boolean) {
    if (foundIds.has(chipId)) return;
    if (isTarget) {
      setFoundIds((prev) => new Set(prev).add(chipId));
      sfx.pop();
      pushFeedback("NICE!", "success");
    } else {
      setWrongTaps((w) => w + 1);
      sfx.error();
      setWrongFlash(chipId);
      pushFeedback("CEK DEUI!", "error");
      setTimeout(() => setWrongFlash(null), 350);
    }
  }

  return (
    <div className="relative flex flex-col gap-4">
      <FeedbackLayer items={feedback} onDone={(id) => setFeedback((prev) => prev.filter((f) => f.id !== id))} />
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <div className="flex items-center justify-between">
        <TimerRing secondsLeft={secondsLeft} totalSeconds={config.timeLimitSeconds} />
        <p className="text-sm font-bold text-navy-700">
          {foundIds.size}/{config.targets.length} ditemukan
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {chips.map((chip) => {
          const found = foundIds.has(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleTap(chip.id, chip.isTarget)}
              disabled={found}
              className={`rounded-2xl border-2 p-3 text-left text-sm font-semibold transition-all ${
                found
                  ? "animate-coin-in border-gold-400 bg-gold-50 text-gold-700"
                  : wrongFlash === chip.id
                    ? "animate-shake border-red-300 bg-red-50 text-red-600"
                    : "border-navy-100 bg-white text-navy-700 active:scale-95"
              }`}
            >
              {found ? "🪙 " : null}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
