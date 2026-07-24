"use client";

import { useRef, useState } from "react";
import { FeedbackLayer, type FeedbackItem } from "@/components/ui/feedback-toast";
import { sfx } from "@/lib/sound";
import type { SwipeCardsConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

type Direction = "right" | "up" | "left";

export function SwipeCardsGame({ config, onFinish }: QuestGameProps<SwipeCardsConfig>) {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [flyDirection, setFlyDirection] = useState<Direction | null>(null);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const currentItem = config.items[index];
  const remaining = config.items.length - index;

  function pushFeedback(text: string, tone: FeedbackItem["tone"]) {
    setFeedback((prev) => [...prev, { id: Date.now() + Math.random(), text, tone }]);
  }

  function decide(direction: Direction) {
    if (!currentItem || flyDirection) return;
    const label = config.directions[direction];
    const correct = label === currentItem.best;
    setDecisions((prev) => ({ ...prev, [currentItem.id]: label }));
    setFlyDirection(direction);
    setDragOffset({ x: 0, y: 0 });

    if (correct) {
      setCombo((c) => c + 1);
      sfx.pop();
      pushFeedback(combo + 1 >= 3 ? "COMBO!" : "NICE!", "success");
    } else {
      setCombo(0);
      sfx.error();
      pushFeedback("CEK DEUI!", "error");
    }

    setTimeout(() => {
      setFlyDirection(null);
      if (index + 1 >= config.items.length) {
        onFinish({ decisions: { ...decisions, [currentItem.id]: label } });
      } else {
        setIndex((i) => i + 1);
      }
    }, 260);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    setDragOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }
  function handlePointerUp() {
    if (!dragStart.current) return;
    const { x, y } = dragOffset;
    dragStart.current = null;
    const threshold = 70;
    if (y < -threshold && Math.abs(y) > Math.abs(x)) return decide("up");
    if (x > threshold) return decide("right");
    if (x < -threshold) return decide("left");
    setDragOffset({ x: 0, y: 0 });
  }

  const flyTransform =
    flyDirection === "right"
      ? "translate(140%, -10%) rotate(18deg)"
      : flyDirection === "left"
        ? "translate(-140%, -10%) rotate(-18deg)"
        : flyDirection === "up"
          ? "translate(0, -160%) rotate(0deg)"
          : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x / 12}deg)`;

  if (!currentItem) return null;

  return (
    <div className="relative flex flex-col gap-4">
      <FeedbackLayer items={feedback} onDone={(id) => setFeedback((prev) => prev.filter((f) => f.id !== id))} />
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <div className="flex items-center justify-between text-xs font-bold text-navy-500">
        <span>Sisa kartu: {remaining}</span>
        {combo >= 2 ? <span className="text-gold-600">Combo x{combo}</span> : <span />}
      </div>

      <div className="relative flex h-40 items-center justify-center">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ transform: flyTransform, transition: flyDirection ? "transform 0.26s ease-out" : dragStart.current ? "none" : "transform 0.2s ease-out", opacity: flyDirection ? 0.2 : 1 }}
          className="flex h-36 w-56 cursor-grab touch-none items-center justify-center rounded-3xl border-2 border-navy-100 bg-white p-4 text-center shadow-md active:cursor-grabbing"
        >
          <p className="text-lg font-extrabold text-navy-900">{currentItem.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => decide("left")}
          className="rounded-2xl bg-red-50 py-3 text-xs font-bold text-red-600 active:scale-95"
        >
          {config.directions.left}
        </button>
        <button
          type="button"
          onClick={() => decide("up")}
          className="rounded-2xl bg-gold-50 py-3 text-xs font-bold text-gold-700 active:scale-95"
        >
          {config.directions.up}
        </button>
        <button
          type="button"
          onClick={() => decide("right")}
          className="rounded-2xl bg-teal-50 py-3 text-xs font-bold text-teal-700 active:scale-95"
        >
          {config.directions.right}
        </button>
      </div>
    </div>
  );
}
