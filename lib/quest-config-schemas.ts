import { z } from "zod";
import type { QuestType } from "@/lib/types";

const badgeSchema = z.object({ code: z.string(), title: z.string() }).optional();

const emojiField = z.string().optional();

export const tapSelectConfigSchema = z.object({
  instruction: z.string(),
  cards: z
    .array(z.object({ id: z.string(), label: z.string(), healthy: z.boolean(), emoji: emojiField }))
    .min(2),
  badge: badgeSchema,
});

export const hiddenObjectConfigSchema = z.object({
  instruction: z.string(),
  timeLimitSeconds: z.number().positive().default(30),
  targets: z.array(z.object({ id: z.string(), label: z.string(), emoji: emojiField })).min(1),
  decoys: z.array(z.object({ id: z.string(), label: z.string(), emoji: emojiField })).default([]),
  badge: badgeSchema,
});

export const budgetSliderConfigSchema = z.object({
  instruction: z.string(),
  totalCoins: z.number().positive().default(100),
  categories: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        emoji: emojiField,
        idealMin: z.number(),
        idealMax: z.number(),
        warningMin: z.number(),
        warningMax: z.number(),
      })
    )
    .min(2),
  badge: badgeSchema,
});

export const swipeCardsConfigSchema = z.object({
  instruction: z.string(),
  directions: z
    .object({ right: z.string(), up: z.string(), left: z.string() })
    .default({ right: "Checkout", up: "Tunda 24 Jam", left: "Keluarkan" }),
  items: z
    .array(z.object({ id: z.string(), label: z.string(), best: z.string(), emoji: emojiField }))
    .min(2),
  badge: badgeSchema,
});

export const matchPairsConfigSchema = z.object({
  instruction: z.string(),
  pairs: z.array(z.object({ id: z.string(), left: z.string(), right: z.string(), emoji: emojiField })).min(2),
  badge: badgeSchema,
});

export const timelineSortConfigSchema = z.object({
  instruction: z.string(),
  items: z.array(z.object({ id: z.string(), label: z.string(), order: z.number().int().positive(), emoji: emojiField })).min(2),
  badge: badgeSchema,
});

export const scenarioChoiceConfigSchema = z.object({
  instruction: z.string(),
  scenarios: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        options: z
          .array(z.object({ id: z.string(), label: z.string(), correct: z.boolean(), feedback: z.string().optional() }))
          .min(2),
      })
    )
    .min(1),
  badge: badgeSchema,
});

export const memoryCardsConfigSchema = z.object({
  instruction: z.string(),
  pairs: z.array(z.object({ id: z.string(), label: z.string(), emoji: emojiField })).min(2),
  badge: badgeSchema,
});

export const quickReactionConfigSchema = z.object({
  instruction: z.string(),
  reactionWindowMs: z.number().positive().default(1200),
  rounds: z.array(z.object({ id: z.string(), label: z.string(), isTarget: z.boolean(), emoji: emojiField })).min(1),
  badge: badgeSchema,
});

export const simulationConfigSchema = z.object({
  instruction: z.string(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        options: z.array(z.object({ id: z.string(), label: z.string(), impact: z.number().min(0).max(1) })).min(2),
      })
    )
    .min(1),
  badge: badgeSchema,
});

export const QUEST_CONFIG_SCHEMAS = {
  tap_select: tapSelectConfigSchema,
  hidden_object: hiddenObjectConfigSchema,
  budget_slider: budgetSliderConfigSchema,
  swipe_cards: swipeCardsConfigSchema,
  match_pairs: matchPairsConfigSchema,
  timeline_sort: timelineSortConfigSchema,
  scenario_choice: scenarioChoiceConfigSchema,
  memory_cards: memoryCardsConfigSchema,
  quick_reaction: quickReactionConfigSchema,
  simulation: simulationConfigSchema,
} as const satisfies Record<QuestType, z.ZodTypeAny>;

export type TapSelectConfig = z.infer<typeof tapSelectConfigSchema>;
export type HiddenObjectConfig = z.infer<typeof hiddenObjectConfigSchema>;
export type BudgetSliderConfig = z.infer<typeof budgetSliderConfigSchema>;
export type SwipeCardsConfig = z.infer<typeof swipeCardsConfigSchema>;
export type MatchPairsConfig = z.infer<typeof matchPairsConfigSchema>;
export type TimelineSortConfig = z.infer<typeof timelineSortConfigSchema>;
export type ScenarioChoiceConfig = z.infer<typeof scenarioChoiceConfigSchema>;
export type MemoryCardsConfig = z.infer<typeof memoryCardsConfigSchema>;
export type QuickReactionConfig = z.infer<typeof quickReactionConfigSchema>;
export type SimulationConfig = z.infer<typeof simulationConfigSchema>;

export type QuestConfigByType = {
  tap_select: TapSelectConfig;
  hidden_object: HiddenObjectConfig;
  budget_slider: BudgetSliderConfig;
  swipe_cards: SwipeCardsConfig;
  match_pairs: MatchPairsConfig;
  timeline_sort: TimelineSortConfig;
  scenario_choice: ScenarioChoiceConfig;
  memory_cards: MemoryCardsConfig;
  quick_reaction: QuickReactionConfig;
  simulation: SimulationConfig;
};

export function isKnownQuestType(value: string): value is QuestType {
  return Object.prototype.hasOwnProperty.call(QUEST_CONFIG_SCHEMAS, value);
}

/**
 * Memvalidasi config_json terhadap skema tipe quest-nya. Dipanggil setiap
 * quest dimuat (bagian 11.3 & 26B). Jika config tidak valid, quest harus
 * disembunyikan dari pemain alih-alih membuat aplikasi crash.
 */
export function validateQuestConfig(
  questType: string,
  rawConfig: unknown
): { success: true; data: unknown } | { success: false; error: string } {
  if (!isKnownQuestType(questType)) {
    return { success: false, error: `quest_type tidak dikenal: ${questType}` };
  }
  const schema = QUEST_CONFIG_SCHEMAS[questType];
  const parsed = schema.safeParse(rawConfig);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }
  return { success: true, data: parsed.data };
}
