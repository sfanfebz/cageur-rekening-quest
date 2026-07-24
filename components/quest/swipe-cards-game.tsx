"use client";

import { useRef, useState } from "react";
import { sfx } from "@/lib/sound";
import type { SwipeCardsConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

type Direction = "right" | "up" | "left";

const SWIPE_THRESHOLD = 70;

const STAMP_STYLE: Record<Direction, string> = {
  right: "right-3 top-1/2 -translate-y-1/2 rotate-[-8deg] border-teal-500 text-teal-600",
  left: "left-3 top-1/2 -translate-y-1/2 rotate-[8deg] border-red-400 text-red-500",
  up: "top-2 left-1/2 -translate-x-1/2 border-gold-500 text-gold-600",
};

export function SwipeCardsGame({ config, onFinish }: QuestGameProps<SwipeCardsConfig>) {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [flyDirection, setFlyDirection] = useState<Direction | null>(null);
  const [combo, setCombo] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const currentItem = config.items[index];
  const remaining = config.items.length - index;

  function decide(direction: Direction) {
    if (!currentItem || flyDirection) return;
    const label = config.directions[direction];
    const correct = label === currentItem.best;
    setDecisions((prev) => ({ ...prev, [currentItem.id]: label }));
    setFlyDirection(direction);

    if (correct) {
      setCombo((c) => c + 1);
      sfx.pop();
    } else {
      setCombo(0);
      sfx.error();
    }

    setTimeout(() => {
      setFlyDirection(null);
      setDragOffset({ x: 0, y: 0 });
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
    if (y < -SWIPE_THRESHOLD && Math.abs(y) > Math.abs(x)) return decide("up");
    if (x > SWIPE_THRESHOLD) return decide("right");
    if (x < -SWIPE_THRESHOLD) return decide("left");
    setDragOffset({ x: 0, y: 0 });
  }

  function stampOpacity(direction: Direction): number {
    if (direction === "right") return dragOffset.x > 0 ? Math.min(dragOffset.x / SWIPE_THRESHOLD, 1) : 0;
    if (direction === "left") return dragOffset.x < 0 ? Math.min(-dragOffset.x / SWIPE_THRESHOLD, 1) : 0;
    return dragOffset.y < 0 && Math.abs(dragOffset.y) > Math.abs(dragOffset.x)
      ? Math.min(-dragOffset.y / SWIPE_THRESHOLD, 1)
      : 0;
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
          className="relative flex h-36 w-56 cursor-grab touch-none items-center justify-center rounded-3xl border-2 border-navy-100 bg-white p-4 text-center shadow-md active:cursor-grabbing"
        >
          <p className="text-lg font-extrabold text-navy-900">{currentItem.label}</p>
          {(["right", "left", "up"] as Direction[]).map((direction) => (
            <span
              key={direction}
              style={{ opacity: stampOpacity(direction), transition: "opacity 150ms ease-out" }}
              className={`pointer-events-none absolute select-none rounded-lg border-2 bg-white/90 px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${STAMP_STYLE[direction]}`}
            >
              {config.directions[direction]}
            </span>
          ))}
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
