import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { KangCageur } from "@/components/ui/kang-cageur";
import { COPY } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getParticipantIdFromSession } from "@/lib/session";
import { getCampaignByCode, getLeaderboardTop, getParticipantRankInCampaign } from "@/lib/data";

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

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/icon-podium.svg" alt="" width={72} height={72} aria-hidden="true" />
        <h1 className="text-lg font-extrabold text-navy-900">{label}</h1>
        <p className="text-sm text-navy-500">{campaign.title}</p>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <KangCageur pose="thumbsup" size={100} />
          <p className="text-sm text-navy-400">Belum ada peserta yang menyelesaikan campaign ini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {top.map((row) => (
            <Card key={row.rank} className="flex items-center gap-3 p-4">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                  row.rank === 1
                    ? "bg-gold-400 text-white"
                    : row.rank === 2
                      ? "bg-navy-300 text-white"
                      : row.rank === 3
                        ? "bg-teal-400 text-white"
                        : "bg-navy-100 text-navy-600"
                }`}
              >
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-navy-900">{row.name}</p>
                <p className="text-xs text-navy-500">
                  {row.questsCompleted} quest selesai · {formatDate(row.completedAt)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-extrabold text-teal-700">
                {row.score}/{row.maxScore}
              </p>
            </Card>
          ))}
        </div>
      )}

      {outsideTop5 ? (
        <p className="text-center text-sm font-semibold text-navy-600">{COPY.leaderboard.yourPosition(myRank!, total)}</p>
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
