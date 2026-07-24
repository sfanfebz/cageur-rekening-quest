import Image from "next/image";
import type { QuestBadge } from "@/lib/types";

export function BadgePill({ badge }: { badge: QuestBadge }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-bold text-gold-700 ring-1 ring-gold-200">
      <Image src="/icon-badge.svg" alt="" width={16} height={16} aria-hidden="true" />
      {badge.title}
    </span>
  );
}
