import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { COPY } from "@/lib/constants";
import type { QuestWithState } from "@/lib/types";

const STATUS_ICON: Record<string, string> = {
  completed: "/icon-checklist.svg",
  started: "/icon-timer.svg",
  available: "/icon-dompet.svg",
  locked: "/icon-gembok.svg",
  upcoming: "/icon-kalender.svg",
};

export function QuestListItem({ questState, campaignCode, index }: { questState: QuestWithState; campaignCode: string; index: number }) {
  const { quest, uiStatus, lockReason, progress, badge } = questState;
  const clickable = uiStatus === "available" || uiStatus === "started";
  const icon = STATUS_ICON[uiStatus] ?? "/icon-checklist.svg";

  const content = (
    <Card
      className={`flex items-center gap-3 p-4 transition ${clickable ? "hover:ring-2 hover:ring-teal-300" : ""} ${
        uiStatus === "upcoming" || uiStatus === "locked" ? "opacity-60" : ""
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50">
        <Image src={icon} alt="" width={24} height={24} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600">Quest {index + 1}</p>
        <p className="truncate text-sm font-extrabold text-navy-900">{quest.title}</p>
        {quest.subtitle ? <p className="truncate text-xs text-navy-500">{quest.subtitle}</p> : null}
        {uiStatus === "locked" && lockReason ? <p className="mt-0.5 text-xs font-semibold text-red-500">{lockReason}</p> : null}
        {uiStatus === "completed" && progress ? (
          <p className="mt-0.5 text-xs font-semibold text-teal-700">
            Skor: {progress.score}/{progress.maxScore}
            {badge ? ` · Badge: ${badge.title}` : ""}
          </p>
        ) : null}
      </div>
      <StatusPill uiStatus={uiStatus} />
    </Card>
  );

  if (!clickable) return content;
  return <Link href={`/campaign/${campaignCode}/quest/${quest.questCode}`}>{content}</Link>;
}

function StatusPill({ uiStatus }: { uiStatus: QuestWithState["uiStatus"] }) {
  if (uiStatus === "completed") {
    return <span className="shrink-0 text-xl" aria-hidden="true">✅</span>;
  }
  const label =
    uiStatus === "started"
      ? COPY.questCardStatus.started
      : uiStatus === "available"
        ? COPY.questCardStatus.available
        : uiStatus === "locked"
          ? COPY.questCardStatus.locked
          : COPY.questCardStatus.upcoming;
  const tone =
    uiStatus === "available" || uiStatus === "started"
      ? "bg-teal-600 text-white"
      : uiStatus === "locked"
        ? "bg-navy-100 text-navy-500"
        : "bg-gold-100 text-gold-700";
  return <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${tone}`}>{label}</span>;
}
