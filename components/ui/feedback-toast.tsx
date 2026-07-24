"use client";

export interface FeedbackItem {
  id: number;
  text: string;
  tone: "success" | "error" | "info";
}

const TONE_CLASSES: Record<FeedbackItem["tone"], string> = {
  success: "bg-teal-600 text-white",
  error: "bg-red-500 text-white",
  info: "bg-gold-400 text-navy-900",
};

/**
 * Lapisan feedback visual mengambang (DING!/NICE!/COMBO!/CEK DEUI!). Dipakai
 * sebagai fallback saat suara tidak tersedia (bagian 29), dan tetap tampil
 * berbarengan dengan efek suara supaya feedback selalu terasa jelas.
 */
export function FeedbackLayer({ items, onDone }: { items: FeedbackItem[]; onDone: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {items.map((item) => (
        <span
          key={item.id}
          onAnimationEnd={() => onDone(item.id)}
          className={`absolute animate-float-up rounded-2xl px-4 py-2 text-lg font-extrabold shadow-lg ${TONE_CLASSES[item.tone]}`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
