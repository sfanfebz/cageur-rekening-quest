"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sound";
import { cardTone } from "@/lib/card-palette";
import { useShuffled } from "@/lib/shuffle";
import type { TimelineSortConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function TimelineSortGame({ config, onFinish }: QuestGameProps<TimelineSortConfig>) {
  const shuffled = useShuffled(config.items);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  function place(id: string) {
    if (orderedIds.includes(id)) return;
    sfx.pop();
    setOrderedIds((prev) => [...prev, id]);
  }

  function reset() {
    setOrderedIds([]);
  }

  const remainingItems = shuffled.filter((item) => !orderedIds.includes(item.id));
  const allPlaced = orderedIds.length === config.items.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy-600">{config.instruction}</p>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-navy-500">Urutan kamu</p>
        <div className="flex min-h-[3.5rem] flex-col gap-1.5 rounded-2xl bg-navy-50 p-2">
          {orderedIds.length === 0 ? (
            <p className="px-2 py-2 text-xs text-navy-400">Tap item di bawah untuk mulai urutkan.</p>
          ) : (
            orderedIds.map((id, i) => {
              const item = config.items.find((it) => it.id === id)!;
              return (
                <div key={id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-navy-800 shadow-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-extrabold text-teal-700">
                    {i + 1}
                  </span>
                  {item.emoji ? <span className="text-base leading-none">{item.emoji}</span> : null}
                  {item.label}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {remainingItems.map((item) => {
          const originalIndex = config.items.findIndex((it) => it.id === item.id);
          const tone = cardTone(originalIndex);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => place(item.id)}
              className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-semibold active:scale-95 ${tone.border} ${tone.bg} ${tone.text}`}
            >
              {item.emoji ? <span className="text-base leading-none">{item.emoji}</span> : null}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={reset} disabled={orderedIds.length === 0} className="flex-1">
          Ulang
        </Button>
        <Button disabled={!allPlaced} onClick={() => onFinish({ orderedIds })} className="flex-1">
          Selesai
        </Button>
      </div>
    </div>
  );
}
