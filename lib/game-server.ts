import { db } from "./supabase";

type Campaign = { id: string; campaign_code: string; title: string; description: string; status: string };
type Quest = { id: string; quest_code: string; title: string; subtitle: string; quest_type: string; status: string; max_score: number; version: number; allow_replay: boolean; config_json: unknown };
type CampaignQuest = { quest_id: string; order_index: number; is_required: boolean; unlock_rule: string; prerequisite_quest_ids: string[] | null };
export const normaliseName = (name: string) => name.trim().replace(/\s+/g, " ");
export const participantKey = (name: string, nip: string) => nip === "00000" ? `00000:${name.toLowerCase()}` : nip;

export async function activeCampaign() { const rows = await db<Campaign[]>("campaigns?status=eq.active&order=start_at.desc&limit=1"); return rows[0] ?? null; }
export async function campaignQuests(campaignId: string) {
  const links = await db<CampaignQuest[]>(`campaign_quests?campaign_id=eq.${campaignId}&order=order_index.asc`);
  if (!links.length) return { links, quests: [] as Quest[] };
  const ids = links.map((link) => link.quest_id).join(",");
  const quests = await db<Quest[]>(`quests?id=in.(${ids})&status=in.(active,upcoming)&select=*`);
  return { links, quests: links.map((link) => quests.find((quest) => quest.id === link.quest_id)).filter((quest): quest is Quest => Boolean(quest)) };
}

export function scoreQuest(quest: Quest, answer: unknown) {
  const config = quest.config_json as Record<string, unknown>;
  if (quest.quest_type === "tap_select") {
    const choices = (config.choices as { label: string; healthy: boolean }[]) ?? []; const picked = new Set(Array.isArray(answer) ? answer.map(String) : []);
    const correct = choices.filter((choice) => choice.healthy); const hits = correct.filter((choice) => picked.has(choice.label)).length; const misses = choices.filter((choice) => !choice.healthy && picked.has(choice.label)).length;
    return Math.max(0, Math.min(quest.max_score, Math.round((hits / Math.max(1, correct.length)) * quest.max_score) - misses * 2));
  }
  if (quest.quest_type === "hidden_object") { const targets = (config.targets as string[]) ?? []; const picked = new Set(Array.isArray(answer) ? answer.map(String) : []); return Math.round(targets.filter((target) => picked.has(target)).length / Math.max(1, targets.length) * quest.max_score); }
  if (quest.quest_type === "budget_slider") { const values = answer as Record<string, number>; const categories = (config.categories as { label: string; ideal: number }[]) ?? []; const delta = categories.reduce((sum, item) => sum + Math.abs(Number(values?.[item.label] ?? 0) - item.ideal), 0); return Math.max(0, Math.min(quest.max_score, quest.max_score - Math.round(delta / 4))); }
  if (quest.quest_type === "swipe_cards") { const items = (config.items as { label: string; best: string }[]) ?? []; const choices = answer as Record<string, string>; return Math.round(items.filter((item) => choices?.[item.label] === item.best).length / Math.max(1, items.length) * quest.max_score); }
  return 0;
}
