import { NextResponse } from "next/server";
import { activeCampaign } from "../../../lib/game-server";
import { db } from "../../../lib/supabase";

type Entry = { total_score: number; completed_quest_count: number; completed_at: string | null; participants: { full_name: string } | null };
async function entries(limit?: number) { const campaign = await activeCampaign(); if (!campaign) return { campaign: null, entries: [] }; const rows = await db<Entry[]>(`participant_campaign_progress?campaign_id=eq.${campaign.id}&status=eq.completed&select=total_score,completed_quest_count,completed_at,participants(full_name)&order=total_score.desc,completed_at.asc${limit ? `&limit=${limit}` : ""}`); return { campaign, entries: rows.map((row, index) => ({ rank: index + 1, name: row.participants?.full_name ?? "Peserta", score: row.total_score, completedQuestCount: row.completed_quest_count, completedAt: row.completed_at })) }; }
export async function GET() { try { return NextResponse.json(await entries(5)); } catch { return NextResponse.json({ error: "Klasemen belum tersedia." }, { status: 500 }); } }
export async function POST(request: Request) { const { passcode } = await request.json(); if (!process.env.LEADERBOARD_PASSCODE || passcode !== process.env.LEADERBOARD_PASSCODE) return NextResponse.json({ error: "Passcode belum cocok. Cek deui, ya." }, { status: 401 }); try { return NextResponse.json(await entries()); } catch { return NextResponse.json({ error: "Klasemen belum tersedia." }, { status: 500 }); } }
