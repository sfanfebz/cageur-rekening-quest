import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { KangCageur } from "@/components/ui/kang-cageur";
import { IconPodium } from "@/components/ui/icons";
import { COPY } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getParticipantIdFromSession } from "@/lib/session";
import { getCampaignByCode, getLeaderboardTop, getParticipantRankInCampaign } from "@/lib/data";
import type { LeaderboardRow } from "@/lib/types";

const PODIUM_SLOTS = [
  { rank: 2, medal: "🥈", circle: "bg-navy-100", bar: "bg-navy-300", circleSize: 56, barHeight: 50 },
  { rank: 1, medal: "🥇", circle: "bg-gold-50", bar: "bg-gold-400", circleSize: 64, barHeight: 70 },
  { rank: 3, medal: "🥉", circle: "bg-red-50", bar: "bg-red-300", circleSize: 56, barHeight: 38 },
] as const;

export default async function CampaignLeaderboardPage({ params }: { params: Promise<{ campaignCode: string }> }) {
  const { campaignCode } = await params;
  const participantId = await getParticipantIdFromSession();
  if (!participantId) redirect("/");

  const campaign = await getCampaignByCode(campaignCode);
  if (!campaign) notFound();

  const { top, total } = await getLeaderboardTop(campaign.id, 5);
  const myRank = await getParticipantRankInCampaign(campaign.id, participantId);
  const label = campaign.status === "archived" ? COPY.leaderboard.archivedLabel : COPY.leaderboard.activeLabel;
  const outsideTop5 = myRank !== null && myRank > 5;
  const podiumRows = new Map<number, LeaderboardRow>(top.slice(0, 3).map((row) => [row.rank, row]));
  const restRows = top.slice(3);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <IconPodium size={48} className="text-gold-400" />
        <h1 className="font-display text-base font-extrabold uppercase tracking-wide text-navy-900">{label}</h1>
        <p className="text-sm text-gray-600">{campaign.title}</p>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <KangCageur pose="thumbsup" size={100} />
          <p className="text-sm text-gray-500">Belum ada peserta yang menyelesaikan campaign ini.</p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-center gap-2 py-2">
            {PODIUM_SLOTS.map((slot) => {
              const row = podiumRows.get(slot.rank);
              if (!row) return null;
              return (
                <div key={slot.rank} className="flex flex-col items-center text-center">
                  <div
                    className={`flex items-center justify-center rounded-full ${slot.circle}`}
                    style={{ width: slot.circleSize, height: slot.circleSize, fontSize: slot.circleSize * 0.4 }}
                  >
                    {slot.medal}
                  </div>
                  <div className={`mt-1.5 w-[60px] rounded-t-lg ${slot.bar}`} style={{ height: slot.barHeight }} />
                  <p className="mt-1 max-w-[70px] truncate text-[10px] font-bold text-navy-900">{row.name}</p>
                  <p className="text-[10px] font-extrabold text-navy-700">{row.score}</p>
                </div>
              );
            })}
          </div>

          {restRows.length > 0 ? (
            <div className="flex flex-col gap-2">
              {restRows.map((row) => (
                <Card key={row.rank} className="flex items-center gap-3 p-4 shadow-none">
                  <span className="font-display w-5 shrink-0 text-sm font-extrabold text-gray-500">{row.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy-900">{row.name}</p>
                    <p className="text-xs text-gray-500">
                      {row.questsCompleted} quest selesai · {formatDate(row.completedAt)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-extrabold text-navy-900">{row.score}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      )}

      {outsideTop5 ? (
        <Card className="border-2 border-teal-500 bg-teal-50 p-3.5 text-center shadow-none">
          <p className="text-sm font-bold text-teal-600">{COPY.leaderboard.yourPosition(myRank!, total)}</p>
        </Card>
      ) : null}

      <LinkButton href="/klasemen" variant="secondary" fullWidth>
        {COPY.hub.viewFullLeaderboard}
      </LinkButton>
      <LinkButton href="/hub" variant="ghost" fullWidth>
        {COPY.result.ctaHub}
      </LinkButton>
    </div>
  );
}
