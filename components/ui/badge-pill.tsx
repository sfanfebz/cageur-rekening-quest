import type { QuestBadge } from "@/lib/types";

export function BadgePill({ badge }: { badge: QuestBadge }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm ring-1 ring-gold-200">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <span className="absolute -bottom-0.5 left-1.5 h-3.5 w-2 -rotate-[18deg] rounded-sm bg-red-500" aria-hidden="true" />
        <span className="absolute -bottom-0.5 right-1.5 h-3.5 w-2 rotate-[18deg] rounded-sm bg-red-600" aria-hidden="true" />
        <span className="relative flex h-7 w-7 animate-badge-shine items-center justify-center rounded-full bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 text-[13px] shadow ring-2 ring-white">
          🏅
        </span>
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-gold-800">{badge.title}</span>
    </span>
  );
}
