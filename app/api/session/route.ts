import { NextResponse } from "next/server";
import { activeCampaign, campaignQuests, normaliseName, participantKey } from "../../../lib/game-server";
import { db } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json(); const fullName = normaliseName(String(body.fullName ?? "")); const nip = String(body.nip ?? "");
    if (fullName.length < 3 || !/[a-z]/i.test(fullName) || !/^\d+$/.test(nip)) return NextResponse.json({ error: "Data belum sesuai. Cek deui nama dan NIP-nya, ya." }, { status: 400 });
    const uniqueKey = participantKey(fullName, nip); let participants = await db<{ id: string; full_name: string }[]>(`participants?unique_key=eq.${encodeURIComponent(uniqueKey)}&select=id,full_name`);
    let participant = participants[0];
    if (!participant) participant = (await db<{ id: string; full_name: string }[]>("participants", { method: "POST", body: JSON.stringify({ full_name: fullName, normalized_name: fullName.toLowerCase(), nip, unique_key: uniqueKey }) }))[0];
    const campaign = await activeCampaign(); if (!campaign) return NextResponse.json({ participant, campaign: null, quests: [], progress: [] });
    const campaignProgress = await db<{ id: string }[]>(`participant_campaign_progress?participant_id=eq.${participant.id}&campaign_id=eq.${campaign.id}&select=id`);
    if (!campaignProgress.length) await db("participant_campaign_progress", { method: "POST", body: JSON.stringify({ participant_id: participant.id, campaign_id: campaign.id, status: "not_started" }) });
    const { links, quests } = await campaignQuests(campaign.id);
    const progress = await db<unknown[]>(`participant_quest_progress?participant_id=eq.${participant.id}&campaign_id=eq.${campaign.id}&select=quest_id,status,score,quest_version,completed_at`);
    const response = NextResponse.json({ participant, campaign, quests, links, progress });
    response.cookies.set("cageur_participant", participant.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) { console.error(error); return NextResponse.json({ error: "Aduh, datanya belum berhasil disimpan. Coba cek koneksi lalu klik Simpan Lagi." }, { status: 500 }); }
}
