"use client";

import { useMemo, useState } from "react";
import { sfx } from "@/lib/sound";
import { cardTone } from "@/lib/card-palette";
import { useShuffled } from "@/lib/shuffle";
import type { MemoryCardsConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

interface CardEntry {
  cardId: string;
  pairId: string;
  label: string;
  emoji?: string;
}

export function MemoryCardsGame({ config, onFinish }: QuestGameProps<MemoryCardsConfig>) {
  const combined = useMemo<CardEntry[]>(
    () =>
      config.pairs.flatMap((p) => [
        { cardId: `${p.id}-a`, pairId: p.id, label: p.label, emoji: p.emoji },
        { cardId: `${p.id}-b`, pairId: p.id, label: p.label, emoji: p.emoji },
      ]),
    [config]
  );
  const cards = useShuffled(combined);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  function flip(card: CardEntry) {
    if (locked || flipped.includes(card.cardId) || matchedPairIds.has(card.pairId)) return;
    const next = [...flipped, card.cardId];
    setFlipped(next);
    if (next.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [firstId, secondId] = next;
      const first = cards.find((c) => c.cardId === firstId)!;
      const second = cards.find((c) => c.cardId === secondId)!;
      const isMatch = first.pairId === second.pairId;
      setTimeout(() => {
        if (isMatch) {
          const updated = new Set(matchedPairIds).add(first.pairId);
          setMatchedPairIds(updated);
          sfx.ding();
          if (updated.size === config.pairs.length) {
            onFinish({ matchedPairIds: Array.from(updated), moves: moves + 1 });
          }
        } else {
          sfx.error();
        }
        setFlipped([]);
        setLocked(false);
      }, 550);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.cardId) || matchedPairIds.has(card.pairId);
          const pairIndex = config.pairs.findIndex((p) => p.id === card.pairId);
          const tone = cardTone(pairIndex);
          return (
            <button
              key={card.cardId}
              type="button"
              onClick={() => flip(card)}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 p-1.5 text-center text-[10px] font-bold transition-all ${
                matchedPairIds.has(card.pairId)
                  ? "animate-glow-pulse border-green-500 bg-green-50 text-green-700"
                  : isFlipped
                    ? `${tone.border} ${tone.bg} ${tone.text}`
                    : "border-navy-600 bg-gradient-to-br from-navy-500 to-navy-700 text-navy-200 active:scale-95"
              }`}
            >
              {isFlipped ? (
                <>
                  <span className="text-lg leading-none">{card.emoji ?? "🎴"}</span>
                  <span>{card.label}</span>
                </>
              ) : (
                <span className="text-lg">❔</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-navy-400">
        {matchedPairIds.size}/{config.pairs.length} pasangan · {moves} langkah
      </p>
    </div>
  );
}
