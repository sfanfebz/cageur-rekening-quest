"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sound";
import { cardTone } from "@/lib/card-palette";
import { useShuffled } from "@/lib/shuffle";
import type { MatchPairsConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function MatchPairsGame({ config, onFinish }: QuestGameProps<MatchPairsConfig>) {
  const leftBase = useMemo(() => config.pairs.map((p) => ({ id: p.id, label: p.left, emoji: p.emoji })), [config]);
  const rightBase = useMemo(() => config.pairs.map((p) => ({ id: p.id, label: p.right })), [config]);
  const leftItems = useShuffled(leftBase);
  const rightItems = useShuffled(rightBase);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  function trySelect(side: "left" | "right", id: string) {
    if (matched.has(id)) return;
    if (side === "left") {
      setSelectedLeft(id);
      return;
    }
    if (!selectedLeft) return;
    if (selectedLeft === id) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelectedLeft(null);
      sfx.ding();
      if (next.size === config.pairs.length) onFinish({ matchedPairIds: Array.from(next) });
    } else {
      setWrongPair({ left: selectedLeft, right: id });
      sfx.error();
      setTimeout(() => setWrongPair(null), 400);
      setSelectedLeft(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {leftItems.map((item, index) => {
            const tone = cardTone(index);
            return (
              <button
                key={item.id}
                type="button"
                disabled={matched.has(item.id)}
                onClick={() => trySelect("left", item.id)}
                className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-left text-xs font-semibold ${
                  matched.has(item.id)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : selectedLeft === item.id
                      ? "border-navy-400 bg-navy-50"
                      : wrongPair?.left === item.id
                        ? "animate-shake border-red-300 bg-red-50"
                        : `${tone.border} ${tone.bg} ${tone.text}`
                }`}
              >
                {item.emoji ? <span className="text-base leading-none">{item.emoji}</span> : null}
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rightItems.map((item, index) => {
            const tone = cardTone(index + 4);
            return (
              <button
                key={item.id}
                type="button"
                disabled={matched.has(item.id)}
                onClick={() => trySelect("right", item.id)}
                className={`rounded-xl border-2 p-2.5 text-left text-xs font-semibold ${
                  matched.has(item.id)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : wrongPair?.right === item.id
                      ? "animate-shake border-red-300 bg-red-50"
                      : `${tone.border} ${tone.bg} ${tone.text}`
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-navy-400">{matched.size}/{config.pairs.length} pasangan cocok</p>
      <Button disabled={matched.size !== config.pairs.length} onClick={() => onFinish({ matchedPairIds: Array.from(matched) })} fullWidth>
        Selesai
      </Button>
    </div>
  );
}
