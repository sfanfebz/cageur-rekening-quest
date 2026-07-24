"use client";

import { useMemo, useState } from "react";
import { sfx } from "@/lib/sound";
import type { MemoryCardsConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

interface CardEntry {
  cardId: string;
  pairId: string;
  label: string;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MemoryCardsGame({ config, onFinish }: QuestGameProps<MemoryCardsConfig>) {
  const cards = useMemo<CardEntry[]>(
    () =>
      shuffle(
        config.pairs.flatMap((p) => [
          { cardId: `${p.id}-a`, pairId: p.id, label: p.label },
          { cardId: `${p.id}-b`, pairId: p.id, label: p.label },
        ])
      ),
    [config]
  );

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
          return (
            <button
              key={card.cardId}
              type="button"
              onClick={() => flip(card)}
              className={`flex h-16 items-center justify-center rounded-2xl border-2 p-1.5 text-center text-[11px] font-bold transition-all ${
                matchedPairIds.has(card.pairId)
                  ? "border-teal-400 bg-teal-50 text-teal-700"
                  : isFlipped
                    ? "border-navy-300 bg-white text-navy-800"
                    : "border-navy-200 bg-navy-500 text-navy-500"
              }`}
            >
              {isFlipped ? card.label : "?"}
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
