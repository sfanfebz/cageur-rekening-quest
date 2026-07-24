import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { activeCampaign, campaignQuests, scoreQuest } from "../../../../lib/game-server";
import { db } from "../../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const { participantId, campaignId, questId, answer } = await request.json(); const participantCookie = (await cookies()).get("cageur_participant")?.value;
    if (!participantCookie || participantCookie !== participantId) return NextResponse.json({ error: "Sesi pemain tidak valid. Masuk lagi, ya." }, { status: 401 });
    const campaign = await activeCampaign();
    if (!campaign || campaign.id !== campaignId) return NextResponse.json({ error: "Misi ini geus kelar waktuna, tapi aya misi baru keur kamu!" }, { status: 409 });
    const { links, quests } = await campaignQuests(campaign.id); const quest = quests.find((item) => item.id === questId); const linkIndex = links.findIndex((item) => item.quest_id === questId);
    if (!quest || quest.status !== "active" || linkIndex < 0) return NextResponse.json({ error: "Quest tidak tersedia." }, { status: 404 });
    const existing = await db<{ status: string }[]>(`participant_quest_progress?participant_id=eq.${participantId}&campaign_id=eq.${campaign.id}&quest_id=eq.${quest.id}&quest_version=eq.${quest.version}&select=status`);
    if (existing[0]?.status === "completed" && !quest.allow_replay) return NextResponse.json({ error: "Quest ini sudah selesai dan skornya terkunci." }, { status: 409 });
    const priorRequired = links.slice(0, linkIndex).filter((link) => link.unlock_rule === "sequential" && link.is_required).map((link) => link.quest_id);
    if (priorRequired.length) { const completed = await db<{ quest_id: string }[]>(`participant_quest_progress?participant_id=eq.${participantId}&campaign_id=eq.${campaign.id}&status=eq.completed&select=quest_id`); if (priorRequired.some((id) => !completed.some((item) => item.quest_id === id))) return NextResponse.json({ error: "Selesaikan misi sebelumnya dulu, ya." }, { status: 409 }); }
    const score = scoreQuest(quest, answer); const now = new Date().toISOString();
    await db("participant_quest_progress?on_conflict=participant_id,campaign_id,quest_id,quest_version", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ participant_id: participantId, campaign_id: campaign.id, quest_id: quest.id, quest_version: quest.version, status: "completed", score, max_score: quest.max_score, answer_data_json: answer, started_at: now, completed_at: now }) });
    const all = await db<{ quest_id: string; score: number }[]>(`participant_quest_progress?participant_id=eq.${participantId}&campaign_id=eq.${campaign.id}&status=eq.completed&select=quest_id,score`); const required = links.filter((link) => link.is_required && quests.some((quest) => quest.id === link.quest_id && quest.status === "active")); const complete = required.every((link) => all.some((entry) => entry.quest_id === link.quest_id));
    await db("participant_campaign_progress?on_conflict=participant_id,campaign_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ participant_id: participantId, campaign_id: campaign.id, status: complete ? "completed" : "started", completed_quest_count: all.length, total_score: all.reduce((sum, item) => sum + item.score, 0), max_score: quests.filter((quest) => required.some((link) => link.quest_id === quest.id)).reduce((sum, quest) => sum + quest.max_score, 0), started_at: now, completed_at: complete ? now : null }) });
    return NextResponse.json({ score, completed: complete });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Aduh, progres belum berhasil disimpan. Coba lagi, ya." }, { status: 500 }); }
}
