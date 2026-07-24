import type { ComponentType } from "react";
import type { QuestType } from "@/lib/types";
import type { QuestGameProps } from "@/components/quest/types";
import { TapSelectGame } from "@/components/quest/tap-select-game";
import { HiddenObjectGame } from "@/components/quest/hidden-object-game";
import { BudgetSliderGame } from "@/components/quest/budget-slider-game";
import { SwipeCardsGame } from "@/components/quest/swipe-cards-game";
import { MatchPairsGame } from "@/components/quest/match-pairs-game";
import { TimelineSortGame } from "@/components/quest/timeline-sort-game";
import { ScenarioChoiceGame } from "@/components/quest/scenario-choice-game";
import { MemoryCardsGame } from "@/components/quest/memory-cards-game";
import { QuickReactionGame } from "@/components/quest/quick-reaction-game";
import { SimulationGame } from "@/components/quest/simulation-game";

/**
 * Registry terpusat quest_type -> komponen game (bagian 11). Menambah quest
 * baru bertipe yang sudah terdaftar di sini cukup lewat data Supabase, tanpa
 * deploy ulang. Tipe benar-benar baru butuh komponen baru + baris baru di sini.
 */
const QUEST_REGISTRY: Record<QuestType, ComponentType<QuestGameProps<never>>> = {
  tap_select: TapSelectGame as ComponentType<QuestGameProps<never>>,
  hidden_object: HiddenObjectGame as ComponentType<QuestGameProps<never>>,
  budget_slider: BudgetSliderGame as ComponentType<QuestGameProps<never>>,
  swipe_cards: SwipeCardsGame as ComponentType<QuestGameProps<never>>,
  match_pairs: MatchPairsGame as ComponentType<QuestGameProps<never>>,
  timeline_sort: TimelineSortGame as ComponentType<QuestGameProps<never>>,
  scenario_choice: ScenarioChoiceGame as ComponentType<QuestGameProps<never>>,
  memory_cards: MemoryCardsGame as ComponentType<QuestGameProps<never>>,
  quick_reaction: QuickReactionGame as ComponentType<QuestGameProps<never>>,
  simulation: SimulationGame as ComponentType<QuestGameProps<never>>,
};

export function getQuestComponent(questType: QuestType): ComponentType<QuestGameProps<never>> {
  return QUEST_REGISTRY[questType];
}
