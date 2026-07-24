"use client";

import { useMemo } from "react";

const COLORS = ["#219a90", "#f7b626", "#33519f", "#72d2c5", "#e89b0c"];

/** Confetti ringan berbasis CSS (bukan canvas) supaya animasinya tetap enteng. */
export function Confetti({ count = 24 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.1,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 60,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-0 block h-2.5 w-1.5 rounded-sm confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--drift": `${piece.drift}px`,
              "--rotate": `${piece.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
