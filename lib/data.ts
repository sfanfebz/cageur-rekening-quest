import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateQuestConfig } from "@/lib/quest-config-schemas";
import type {
  Campaign,
  CampaignProgressSummary,
  CampaignQuestLink,
  LeaderboardRow,
  Participant,
  ParticipantSummary,
  QuestBadge,
  QuestRecord,
  QuestWithState,
  UnlockRule,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Mapper: baris Supabase (snake_case) -> tipe aplikasi (camelCase)
// ---------------------------------------------------------------------------
function mapParticipant(row: any): Participant {
  return {
    id: row.id,
    fullName: row.full_name,
    normalizedName: row.normalized_name,
    nip: row.nip,
    uniqueKey: row.unique_key,
  };
}

function mapCampaign(row: any): Campaign {
  return {
    id: row.id,
    campaignCode: row.campaign_code,
    title: row.title,
    description: row.description,
    status: row.status,
    startAt: row.start_at,
    endAt: row.end_at,
  };
}

function mapQuest(row: any): QuestRecord {
  return {
    id: row.id,
    questCode: row.quest_code,
    title: row.title,
    subtitle: row.subtitle,
    questType: row.quest_type,
    status: row.status,
    maxScore: row.max_score,
    version: row.version,
    allowReplay: row.allow_replay,
    configJson: row.config_json,
  };
}

function mapLink(row: any): CampaignQuestLink {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    questId: row.quest_id,
    orderIndex: row.order_index,
    isRequired: row.is_required,
    unlockRule: row.unlock_rule as UnlockRule,
    prerequisiteQuestIds: row.prerequisite_quest_ids ?? [],
    availableFrom: row.available_from,
    availableUntil: row.available_until,
  };
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------
export async function getParticipantById(participantId: string): Promise<Participant | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .maybeSingle();
  if (error || !data) return null;
  return mapParticipant(data);
}

export async function upsertParticipant(input: {
  fullName: string;
  normalizedName: string;
  nip: string;
  uniqueKey: string;
}): Promise<Participant> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("participants")
    .select("*")
    .eq("unique_key", input.uniqueKey)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from("participants")
      .update({ full_name: input.fullName, normalized_name: input.normalizedName, nip: input.nip })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !updated) throw new Error("Gagal memperbarui data peserta.");
    return mapParticipant(updated);
  }

  const { data: created, error } = await supabase
    .from("participants")
    .insert({
      full_name: input.fullName,
      normalized_name: input.normalizedName,
      nip: input.nip,
      unique_key: input.uniqueKey,
    })
    .select("*")
    .single();
  if (error || !created) throw new Error("Gagal membuat data peserta.");
  return mapParticipant(created);
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------
export async function getActiveCampaign(): Promise<Campaign | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapCampaign(data);
}

export async function getUpcomingCampaigns(): Promise<Campaign[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("campaigns")
    .select("*")
    .eq("status", "upcoming")
    .order("start_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapCampaign);
}

export async function getCampaignByCode(campaignCode: string): Promise<Campaign | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("campaigns")
    .select("*")
    .eq("campaign_code", campaignCode)
    .maybeSingle();
  if (error || !data) return null;
  return mapCampaign(data);
}

/** Campaign archived yang pernah diikuti pemain (punya baris progres), untuk tab Riwayat Misi. */
export async function getArchivedParticipatedCampaigns(participantId: string): Promise<Campaign[]> {
  const supabase = getSupabaseAdmin();
  const { data: progressRows } = await supabase
    .from("participant_campaign_progress")
    .select("campaign_id")
    .eq("participant_id", participantId);
  const campaignIds = [...new Set((progressRows ?? []).map((r: any) => r.campaign_id))];
  if (campaignIds.length === 0) return [];
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .in("id", campaignIds)
    .eq("status", "archived")
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapCampaign);
}

// ---------------------------------------------------------------------------
// Campaign progress
// ---------------------------------------------------------------------------
export async function ensureParticipantCampaignProgress(participantId: string, campaignId: string) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("participant_campaign_progress")
    .select("*")
    .eq("participant_id", participantId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (existing) return existing;
  const { data: created, error } = await supabase
    .from("participant_campaign_progress")
    .insert({ participant_id: participantId, campaign_id: campaignId, status: "not_started" })
    .select("*")
    .single();
  if (error || !created) throw new Error("Gagal membuat progres campaign.");
  return created;
}

export async function getParticipantCampaignProgressRow(participantId: string, campaignId: string) {
  const { data } = await getSupabaseAdmin()
    .from("participant_campaign_progress")
    .select("*")
    .eq("participant_id", participantId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return data;
}

/** Cari campaign yang punya progres `started` tapi campaign-nya sudah archived (bagian 21B). */
export async function findStartedArchivedCampaign(participantId: string, excludeCampaignId: string | null) {
  const supabase = getSupabaseAdmin();
  const { data: progressRows } = await supabase
    .from("participant_campaign_progress")
    .select("campaign_id, status")
    .eq("participant_id", participantId)
    .in("status", ["started"]);
  if (!progressRows || progressRows.length === 0) return null;
  const candidateIds = progressRows.map((r: any) => r.campaign_id).filter((id: string) => id !== excludeCampaignId);
  if (candidateIds.length === 0) return null;
  const { data: campaigns } = await supabase.from("campaigns").select("*").in("id", candidateIds).eq("status", "archived");
  if (!campaigns || campaigns.length === 0) return null;
  return mapCampaign(campaigns[0]);
}

// ---------------------------------------------------------------------------
// Quests per campaign, dengan status UI (bagian 12 & 25)
// ---------------------------------------------------------------------------
export async function getCampaignQuestsWithState(
  campaign: Campaign,
  participantId: string | null
): Promise<QuestWithState[]> {
  const supabase = getSupabaseAdmin();
  const { data: linkRows, error: linkError } = await supabase
    .from("campaign_quests")
    .select("*")
    .eq("campaign_id", campaign.id)
    .order("order_index", { ascending: true });
  if (linkError || !linkRows || linkRows.length === 0) return [];

  const questIds = linkRows.map((r: any) => r.quest_id);
  const { data: questRows } = await supabase.from("quests").select("*").in("id", questIds);
  const questsById = new Map<string, QuestRecord>((questRows ?? []).map((r: any) => [r.id, mapQuest(r)]));

  let progressByQuestId = new Map<string, any>();
  if (participantId) {
    const { data: progressRows } = await supabase
      .from("participant_quest_progress")
      .select("*")
      .eq("participant_id", participantId)
      .eq("campaign_id", campaign.id);
    progressByQuestId = new Map((progressRows ?? []).map((r: any) => [`${r.quest_id}:${r.quest_version}`, r]));
  }

  const links = linkRows.map(mapLink);
  const results: QuestWithState[] = [];

  for (const link of links) {
    const quest = questsById.get(link.questId);
    if (!quest) continue;

    if (quest.status === "draft" || quest.status === "disabled") {
      continue; // sembunyikan total
    }

    const validation = validateQuestConfig(quest.questType, quest.configJson);
    if (!validation.success) {
      console.error(`[quest-config] ${quest.questCode} disembunyikan: ${validation.error}`);
      continue;
    }

    const badge = extractBadge(validation.data);
    const progress = progressByQuestId.get(`${quest.id}:${quest.version}`);

    if (quest.status === "upcoming") {
      results.push({ quest, link, uiStatus: "upcoming", lockReason: null, progress: null, badge });
      continue;
    }

    if (quest.status === "archived") {
      if (progress) {
        results.push({
          quest,
          link,
          uiStatus: progress.status === "completed" ? "completed" : "locked",
          lockReason: progress.status === "completed" ? null : "Misi ini sudah diarsipkan.",
          progress: {
            status: progress.status,
            score: progress.score,
            maxScore: progress.max_score,
            completedAt: progress.completed_at,
          },
          badge,
        });
      }
      continue; // tidak pernah dimainkan -> sembunyikan
    }

    // quest.status === "active"
    if (progress?.status === "completed") {
      results.push({
        quest,
        link,
        uiStatus: "completed",
        lockReason: null,
        progress: {
          status: "completed",
          score: progress.score,
          maxScore: progress.max_score,
          completedAt: progress.completed_at,
        },
        badge,
      });
      continue;
    }

    if (progress?.status === "started") {
      results.push({
        quest,
        link,
        uiStatus: "started",
        lockReason: null,
        progress: { status: "started", score: null, maxScore: quest.maxScore, completedAt: null },
        badge,
      });
      continue;
    }

    const unlockCheck = evaluateUnlock(link, links, questsById, progressByQuestId);
    results.push({
      quest,
      link,
      uiStatus: unlockCheck.unlocked ? "available" : "locked",
      lockReason: unlockCheck.unlocked ? null : unlockCheck.reason,
      progress: null,
      badge,
    });
  }

  return results;
}

function extractBadge(config: unknown): QuestBadge | null {
  if (config && typeof config === "object" && "badge" in config) {
    const badge = (config as { badge?: QuestBadge }).badge;
    if (badge && typeof badge.code === "string" && typeof badge.title === "string") return badge;
  }
  return null;
}

function evaluateUnlock(
  link: CampaignQuestLink,
  allLinks: CampaignQuestLink[],
  questsById: Map<string, QuestRecord>,
  progressByQuestId: Map<string, any>
): { unlocked: boolean; reason: string | null } {
  switch (link.unlockRule) {
    case "independent":
      return { unlocked: true, reason: null };

    case "sequential": {
      const sorted = [...allLinks].sort((a, b) => a.orderIndex - b.orderIndex);
      const currentIndex = sorted.findIndex((l) => l.id === link.id);
      const previousRequired = sorted
        .slice(0, currentIndex)
        .filter((l) => l.isRequired)
        .filter((l) => questsById.get(l.questId)?.status === "active");
      const previousQuest = previousRequired[previousRequired.length - 1];
      if (!previousQuest) return { unlocked: true, reason: null };
      const prevQuestRecord = questsById.get(previousQuest.questId);
      const prevProgress = prevQuestRecord
        ? progressByQuestId.get(`${prevQuestRecord.id}:${prevQuestRecord.version}`)
        : null;
      if (prevProgress?.status === "completed") return { unlocked: true, reason: null };
      return {
        unlocked: false,
        reason: prevQuestRecord ? `Selesaikan ${prevQuestRecord.title} dulu.` : "Selesaikan misi sebelumnya dulu.",
      };
    }

    case "prerequisite": {
      const unmet = link.prerequisiteQuestIds.filter((questId) => {
        const questRecord = questsById.get(questId);
        if (!questRecord) return false;
        const progress = progressByQuestId.get(`${questId}:${questRecord.version}`);
        return progress?.status !== "completed";
      });
      if (unmet.length === 0) return { unlocked: true, reason: null };
      return { unlocked: false, reason: "Selesaikan misi prasyarat dulu." };
    }

    case "scheduled": {
      const now = Date.now();
      if (link.availableFrom && now < new Date(link.availableFrom).getTime()) {
        return { unlocked: false, reason: "Belum waktunya. Cek deui nanti, ya." };
      }
      if (link.availableUntil && now > new Date(link.availableUntil).getTime()) {
        return { unlocked: false, reason: "Waktu misi ini sudah lewat." };
      }
      return { unlocked: true, reason: null };
    }

    default:
      return { unlocked: true, reason: null };
  }
}

// ---------------------------------------------------------------------------
// Ringkasan progres campaign (bagian 18 & 19)
// ---------------------------------------------------------------------------
export function summarizeCampaignProgress(questStates: QuestWithState[]): CampaignProgressSummary {
  const activeQuests = questStates.filter((q) => q.quest.status === "active" || q.uiStatus === "completed");
  const requiredActive = activeQuests.filter((q) => q.link.isRequired && q.quest.status === "active");
  const completedRequired = requiredActive.filter((q) => q.uiStatus === "completed");
  const scored = activeQuests.filter((q) => q.quest.status === "active");
  const totalScore = scored.reduce((sum, q) => sum + (q.progress?.status === "completed" ? q.progress.score ?? 0 : 0), 0);
  const maxScore = scored.reduce((sum, q) => sum + q.quest.maxScore, 0);
  const completedCount = scored.filter((q) => q.uiStatus === "completed").length;

  let status: CampaignProgressSummary["status"] = "not_started";
  if (completedCount > 0 || scored.some((q) => q.uiStatus === "started")) status = "started";
  if (requiredActive.length > 0 && completedRequired.length === requiredActive.length) status = "completed";

  const completionTimes = scored
    .map((q) => q.progress?.completedAt)
    .filter((v): v is string => Boolean(v))
    .sort();

  return {
    status,
    completedQuestCount: completedCount,
    totalRequiredActiveQuests: requiredActive.length,
    totalScore,
    maxScore,
    startedAt: null,
    completedAt: status === "completed" ? completionTimes[completionTimes.length - 1] ?? null : null,
  };
}

// ---------------------------------------------------------------------------
// Ringkasan pemain lintas campaign (untuk header Game Hub)
// ---------------------------------------------------------------------------
export async function getParticipantSummary(participantId: string): Promise<ParticipantSummary> {
  const supabase = getSupabaseAdmin();
  const { data: campaignProgressRows } = await supabase
    .from("participant_campaign_progress")
    .select("status")
    .eq("participant_id", participantId)
    .neq("status", "not_started");

  const { data: questProgressRows } = await supabase
    .from("participant_quest_progress")
    .select("quest_id, quest_version, status")
    .eq("participant_id", participantId)
    .eq("status", "completed");

  const completedQuestRows = questProgressRows ?? [];
  const badgeCount = await countBadges(completedQuestRows);

  return {
    totalCampaignsJoined: (campaignProgressRows ?? []).length,
    totalQuestsCompleted: completedQuestRows.length,
    totalBadges: badgeCount,
  };
}

async function countBadges(completedRows: { quest_id: string }[]): Promise<number> {
  if (completedRows.length === 0) return 0;
  const supabase = getSupabaseAdmin();
  const questIds = [...new Set(completedRows.map((r) => r.quest_id))];
  const { data: questRows } = await supabase.from("quests").select("id, config_json").in("id", questIds);
  let count = 0;
  for (const row of questRows ?? []) {
    if (extractBadge(row.config_json)) count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Leaderboard (bagian 20 & 20B)
// ---------------------------------------------------------------------------
async function fetchLeaderboardRows(campaignId: string): Promise<LeaderboardRow[]> {
  const supabase = getSupabaseAdmin();
  const { data: progressRows, error } = await supabase
    .from("participant_campaign_progress")
    .select("participant_id, total_score, max_score, completed_quest_count, completed_at, status")
    .eq("campaign_id", campaignId)
    .eq("status", "completed")
    .order("total_score", { ascending: false })
    .order("completed_at", { ascending: true });
  if (error || !progressRows || progressRows.length === 0) return [];

  const participantIds = progressRows.map((r: any) => r.participant_id);
  const { data: participantRows } = await supabase.from("participants").select("id, full_name").in("id", participantIds);
  const nameById = new Map((participantRows ?? []).map((p: any) => [p.id, p.full_name as string]));

  return progressRows.map((row: any, index: number) => ({
    rank: index + 1,
    name: nameById.get(row.participant_id) ?? "Peserta",
    score: row.total_score,
    maxScore: row.max_score,
    questsCompleted: row.completed_quest_count,
    completedAt: row.completed_at,
  }));
}

export async function getLeaderboardTop(campaignId: string, limit = 5) {
  const rows = await fetchLeaderboardRows(campaignId);
  return { top: rows.slice(0, limit), total: rows.length, all: rows };
}

export async function getParticipantRankInCampaign(campaignId: string, participantId: string): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  const { data: progressRow } = await supabase
    .from("participant_campaign_progress")
    .select("participant_id")
    .eq("campaign_id", campaignId)
    .eq("participant_id", participantId)
    .eq("status", "completed")
    .maybeSingle();
  if (!progressRow) return null;
  const { data: allProgress } = await supabase
    .from("participant_campaign_progress")
    .select("participant_id, total_score, completed_at")
    .eq("campaign_id", campaignId)
    .eq("status", "completed")
    .order("total_score", { ascending: false })
    .order("completed_at", { ascending: true });
  const index = (allProgress ?? []).findIndex((r: any) => r.participant_id === participantId);
  return index === -1 ? null : index + 1;
}

export async function getFullLeaderboard(campaignId: string): Promise<LeaderboardRow[]> {
  return fetchLeaderboardRows(campaignId);
}

// ---------------------------------------------------------------------------
// Quest lookup + penulisan progres (dipakai Route Handler)
// ---------------------------------------------------------------------------
export async function getQuestByCode(questCode: string): Promise<QuestRecord | null> {
  const { data, error } = await getSupabaseAdmin().from("quests").select("*").eq("quest_code", questCode).maybeSingle();
  if (error || !data) return null;
  return mapQuest(data);
}

export async function getQuestProgressRow(
  participantId: string,
  campaignId: string,
  questId: string,
  questVersion: number
) {
  const { data } = await getSupabaseAdmin()
    .from("participant_quest_progress")
    .select("*")
    .eq("participant_id", participantId)
    .eq("campaign_id", campaignId)
    .eq("quest_id", questId)
    .eq("quest_version", questVersion)
    .maybeSingle();
  return data;
}

export async function startQuestProgress(
  participantId: string,
  campaignId: string,
  quest: QuestRecord
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const existing = await getQuestProgressRow(participantId, campaignId, quest.id, quest.version);
  if (existing) {
    if (existing.status === "completed") return; // sudah selesai, jangan reset
    if (existing.status !== "started") {
      await supabase
        .from("participant_quest_progress")
        .update({ status: "started", started_at: existing.started_at ?? new Date().toISOString() })
        .eq("id", existing.id);
    }
    return;
  }
  await supabase.from("participant_quest_progress").insert({
    participant_id: participantId,
    campaign_id: campaignId,
    quest_id: quest.id,
    quest_version: quest.version,
    status: "started",
    max_score: quest.maxScore,
    started_at: new Date().toISOString(),
  });

  const campaignProgress = await ensureParticipantCampaignProgress(participantId, campaignId);
  if (campaignProgress.status === "not_started") {
    await supabase
      .from("participant_campaign_progress")
      .update({ status: "started", started_at: campaignProgress.started_at ?? new Date().toISOString() })
      .eq("id", campaignProgress.id);
  }
}

export async function saveQuestCompletion(
  participantId: string,
  campaignId: string,
  quest: QuestRecord,
  score: number,
  answerData: unknown
): Promise<{ alreadyCompleted: boolean }> {
  const supabase = getSupabaseAdmin();
  const existing = await getQuestProgressRow(participantId, campaignId, quest.id, quest.version);

  if (existing?.status === "completed" && !quest.allowReplay) {
    return { alreadyCompleted: true };
  }

  const payload = {
    participant_id: participantId,
    campaign_id: campaignId,
    quest_id: quest.id,
    quest_version: quest.version,
    status: "completed",
    score,
    max_score: quest.maxScore,
    answer_data_json: answerData as any,
    started_at: existing?.started_at ?? new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("participant_quest_progress").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("participant_quest_progress").insert(payload);
  }

  return { alreadyCompleted: false };
}

/** Hitung ulang & simpan agregat participant_campaign_progress setelah sebuah quest selesai (bagian 18 & 19). */
export async function recomputeAndSaveCampaignProgress(participantId: string, campaign: Campaign): Promise<CampaignProgressSummary> {
  const questStates = await getCampaignQuestsWithState(campaign, participantId);
  const summary = summarizeCampaignProgress(questStates);
  const supabase = getSupabaseAdmin();
  const existing = await ensureParticipantCampaignProgress(participantId, campaign.id);

  await supabase
    .from("participant_campaign_progress")
    .update({
      status: summary.status,
      completed_quest_count: summary.completedQuestCount,
      total_score: summary.totalScore,
      max_score: summary.maxScore,
      started_at: existing.started_at ?? (summary.status !== "not_started" ? new Date().toISOString() : null),
      completed_at: summary.status === "completed" ? existing.completed_at ?? new Date().toISOString() : existing.completed_at,
    })
    .eq("id", existing.id);

  return summary;
}
