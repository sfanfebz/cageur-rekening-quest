import Link from "next/link";
import { Card } from "@/components/ui/card";
import { IconChecklist, IconTimer, IconDompet, IconGembok, IconKalender, type IconProps } from "@/components/ui/icons";
import { COPY } from "@/lib/constants";
import type { QuestWithState } from "@/lib/types";

const STATUS_ICON: Record<string, (props: IconProps) => React.JSX.Element> = {
  completed: IconChecklist,
  started: IconTimer,
  available: IconDompet,
  locked: IconGembok,
  upcoming: IconKalender,
};

const STATUS_ICON_TONE: Record<string, string> = {
  completed: "bg-green-50 text-green-600",
  started: "bg-teal-50 text-teal-600",
  available: "bg-teal-50 text-teal-600",
  locked: "bg-gray-100 text-gray-500",
  upcoming: "bg-gray-100 text-gray-500",
};

export function QuestListItem({ questState, campaignCode, index }: { questState: QuestWithState; campaignCode: string; index: number }) {
  const { quest, uiStatus, lockReason, progress, badge } = questState;
  const clickable = uiStatus === "available" || uiStatus === "started";
  const Icon = STATUS_ICON[uiStatus] ?? IconChecklist;

  const content = (
    <Card
      className={`flex items-center gap-3 p-4 transition ${clickable ? "hover:ring-2 hover:ring-teal-300" : ""} ${
        uiStatus === "upcoming" || uiStatus === "locked" ? "opacity-70" : ""
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${STATUS_ICON_TONE[uiStatus] ?? "bg-gray-100 text-gray-500"}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600">Quest {index + 1}</p>
        <p className="truncate font-display text-sm font-extrabold text-navy-900">{quest.title}</p>
        {quest.subtitle ? <p className="truncate text-xs text-gray-500">{quest.subtitle}</p> : null}
        {uiStatus === "locked" && lockReason ? <p className="mt-0.5 text-xs font-semibold text-red-500">{lockReason}</p> : null}
        {uiStatus === "completed" && progress ? (
          <p className="mt-0.5 text-xs font-bold text-green-600">
            Selesai — {progress.score}/{progress.maxScore} poin
            {badge ? ` · ${badge.title}` : ""}
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
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-black text-white" aria-hidden="true">
        ✓
      </span>
    );
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
      ? "bg-teal-500 text-white"
      : uiStatus === "locked"
        ? "bg-gray-100 text-gray-500"
        : "bg-gold-50 text-gold-600";
  return <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${tone}`}>{label}</span>;
}
