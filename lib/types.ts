export type CampaignStatus = "draft" | "upcoming" | "active" | "archived" | "disabled";
export type QuestStatus = "draft" | "upcoming" | "active" | "archived" | "disabled";
export type UnlockRule = "independent" | "sequential" | "prerequisite" | "scheduled";
export type CampaignProgressStatus = "not_started" | "started" | "completed";
export type QuestProgressStatus = "locked" | "available" | "started" | "completed";

export const QUEST_TYPES = [
  "tap_select",
  "hidden_object",
  "budget_slider",
  "swipe_cards",
  "match_pairs",
  "timeline_sort",
  "scenario_choice",
  "memory_cards",
  "quick_reaction",
  "simulation",
] as const;

export type QuestType = (typeof QUEST_TYPES)[number];

export interface Participant {
  id: string;
  fullName: string;
  normalizedName: string;
  nip: string;
  uniqueKey: string;
}

export interface Campaign {
  id: string;
  campaignCode: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  startAt: string | null;
  endAt: string | null;
}

export interface QuestBadge {
  code: string;
  title: string;
}

export interface QuestRecord {
  id: string;
  questCode: string;
  title: string;
  subtitle: string | null;
  questType: string;
  status: QuestStatus;
  maxScore: number;
  version: number;
  allowReplay: boolean;
  configJson: unknown;
}

export interface CampaignQuestLink {
  id: string;
  campaignId: string;
  questId: string;
  orderIndex: number;
  isRequired: boolean;
  unlockRule: UnlockRule;
  prerequisiteQuestIds: string[];
  availableFrom: string | null;
  availableUntil: string | null;
}

/** Gabungan quest + link campaign + progres pemain, siap dipakai UI. */
export interface QuestWithState {
  quest: QuestRecord;
  link: CampaignQuestLink;
  uiStatus: "available" | "started" | "completed" | "locked" | "upcoming" | "hidden";
  lockReason: string | null;
  progress: {
    status: QuestProgressStatus;
    score: number | null;
    maxScore: number | null;
    completedAt: string | null;
  } | null;
  badge: QuestBadge | null;
}

export interface CampaignProgressSummary {
  status: CampaignProgressStatus;
  completedQuestCount: number;
  totalRequiredActiveQuests: number;
  totalScore: number;
  maxScore: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  score: number;
  maxScore: number;
  questsCompleted: number;
  completedAt: string | null;
}

export interface ParticipantSummary {
  totalCampaignsJoined: number;
  totalQuestsCompleted: number;
  totalBadges: number;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export interface AdminDashboardStats {
  activeCampaignTitle: string | null;
  totalParticipants: number;
  completedCount: number;
  averageScorePercent: number | null;
}

export interface AdminParticipantOption {
  id: string;
  fullName: string;
  nip: string;
}

export interface AdminParticipantHistoryRow {
  campaignCode: string;
  campaignTitle: string;
  status: CampaignProgressStatus;
  totalScore: number;
  maxScore: number;
  completedQuestCount: number;
  completedAt: string | null;
}

export interface AdminCampaignOption {
  id: string;
  campaignCode: string;
  title: string;
  status: CampaignStatus;
  questCount: number;
}
