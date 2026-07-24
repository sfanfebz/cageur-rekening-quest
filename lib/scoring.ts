import { z } from "zod";
import { clamp } from "@/lib/format";
import type {
  BudgetSliderConfig,
  HiddenObjectConfig,
  MatchPairsConfig,
  MemoryCardsConfig,
  QuestConfigByType,
  QuickReactionConfig,
  ScenarioChoiceConfig,
  SimulationConfig,
  SwipeCardsConfig,
  TapSelectConfig,
  TimelineSortConfig,
} from "@/lib/quest-config-schemas";
import type { QuestType } from "@/lib/types";

export interface ScoreResult {
  score: number;
  detail: Record<string, unknown>;
}

function round(value: number): number {
  return Math.round(value);
}

// ---------------------------------------------------------------------------
// tap_select — pilih semua kebiasaan sehat, hindari yang tidak sehat.
// ---------------------------------------------------------------------------
const tapSelectAnswerSchema = z.object({ selectedIds: z.array(z.string()).default([]) });

function scoreTapSelect(config: TapSelectConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = tapSelectAnswerSchema.parse(rawAnswer ?? {});
  const selected = new Set(answer.selectedIds);
  const healthyIds = config.cards.filter((c) => c.healthy).map((c) => c.id);
  const totalHealthy = healthyIds.length || 1;
  let correct = 0;
  let wrong = 0;
  for (const card of config.cards) {
    const wasSelected = selected.has(card.id);
    if (wasSelected && card.healthy) correct += 1;
    if (wasSelected && !card.healthy) wrong += 1;
  }
  const fraction = clamp((correct - wrong) / totalHealthy, 0, 1);
  return { score: round(fraction * maxScore), detail: { correct, wrong } };
}

// ---------------------------------------------------------------------------
// hidden_object — temukan target dalam batas waktu.
// ---------------------------------------------------------------------------
const hiddenObjectAnswerSchema = z.object({
  foundIds: z.array(z.string()).default([]),
  wrongTaps: z.number().int().min(0).default(0),
});

function scoreHiddenObject(config: HiddenObjectConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = hiddenObjectAnswerSchema.parse(rawAnswer ?? {});
  const targetIds = new Set(config.targets.map((t) => t.id));
  const foundValid = answer.foundIds.filter((id) => targetIds.has(id));
  const uniqueFound = new Set(foundValid);
  const totalTargets = config.targets.length || 1;
  const fraction = clamp(uniqueFound.size / totalTargets, 0, 1);
  return { score: round(fraction * maxScore), detail: { found: uniqueFound.size, totalTargets } };
}

// ---------------------------------------------------------------------------
// budget_slider — alokasi 100 koin, dinilai lewat zona hijau/kuning/merah.
// ---------------------------------------------------------------------------
const budgetSliderAnswerSchema = z.object({ allocations: z.record(z.string(), z.number()) });

type Zone = "green" | "yellow" | "red";

function budgetZone(value: number, cat: BudgetSliderConfig["categories"][number]): Zone {
  if (value >= cat.idealMin && value <= cat.idealMax) return "green";
  if (value >= cat.warningMin && value <= cat.warningMax) return "yellow";
  return "red";
}

function scoreBudgetSlider(config: BudgetSliderConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = budgetSliderAnswerSchema.parse(rawAnswer ?? {});
  const perCategory = maxScore / config.categories.length;
  const zones: Record<string, Zone> = {};
  let total = 0;
  for (const cat of config.categories) {
    const value = clamp(answer.allocations[cat.id] ?? 0, 0, config.totalCoins);
    const zone = budgetZone(value, cat);
    zones[cat.id] = zone;
    if (zone === "green") total += perCategory;
    else if (zone === "yellow") total += perCategory * 0.5;
  }
  const sumAllocated = config.categories.reduce((acc, cat) => acc + (answer.allocations[cat.id] ?? 0), 0);
  // Penalti kecil kalau total alokasi tidak tepat 100 supaya tetap edukatif, bukan menggagalkan skor.
  const totalDeviationPenalty = Math.abs(sumAllocated - config.totalCoins) > 0.01 ? 0.9 : 1;
  return { score: round(total * totalDeviationPenalty), detail: { zones, sumAllocated } };
}

// ---------------------------------------------------------------------------
// swipe_cards — arahkan tiap barang ke keputusan paling bijak.
// ---------------------------------------------------------------------------
const swipeCardsAnswerSchema = z.object({ decisions: z.record(z.string(), z.string()) });

function scoreSwipeCards(config: SwipeCardsConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = swipeCardsAnswerSchema.parse(rawAnswer ?? {});
  const perItem = maxScore / config.items.length;
  let correct = 0;
  let bestCombo = 0;
  let currentCombo = 0;
  for (const item of config.items) {
    const decision = answer.decisions[item.id];
    if (decision === item.best) {
      correct += 1;
      currentCombo += 1;
      bestCombo = Math.max(bestCombo, currentCombo);
    } else {
      currentCombo = 0;
    }
  }
  const comboBonusFraction = Math.min(bestCombo / config.items.length, 0.15);
  const fraction = clamp(correct / config.items.length + comboBonusFraction, 0, 1);
  return { score: round(fraction * maxScore), detail: { correct, bestCombo } };
}

// ---------------------------------------------------------------------------
// match_pairs — jodohkan pasangan.
// ---------------------------------------------------------------------------
const matchPairsAnswerSchema = z.object({ matchedPairIds: z.array(z.string()).default([]) });

function scoreMatchPairs(config: MatchPairsConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = matchPairsAnswerSchema.parse(rawAnswer ?? {});
  const validPairIds = new Set(config.pairs.map((p) => p.id));
  const matched = new Set(answer.matchedPairIds.filter((id) => validPairIds.has(id)));
  const fraction = clamp(matched.size / (config.pairs.length || 1), 0, 1);
  return { score: round(fraction * maxScore), detail: { matched: matched.size } };
}

// ---------------------------------------------------------------------------
// timeline_sort — urutkan item sesuai urutan yang tepat.
// ---------------------------------------------------------------------------
const timelineSortAnswerSchema = z.object({ orderedIds: z.array(z.string()).default([]) });

function scoreTimelineSort(config: TimelineSortConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = timelineSortAnswerSchema.parse(rawAnswer ?? {});
  const correctOrder = [...config.items].sort((a, b) => a.order - b.order).map((i) => i.id);
  let correctPlacements = 0;
  answer.orderedIds.forEach((id, index) => {
    if (correctOrder[index] === id) correctPlacements += 1;
  });
  const fraction = clamp(correctPlacements / (correctOrder.length || 1), 0, 1);
  return { score: round(fraction * maxScore), detail: { correctPlacements } };
}

// ---------------------------------------------------------------------------
// scenario_choice — pilihan ganda bertahap.
// ---------------------------------------------------------------------------
const scenarioChoiceAnswerSchema = z.object({ choices: z.record(z.string(), z.string()) });

function scoreScenarioChoice(config: ScenarioChoiceConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = scenarioChoiceAnswerSchema.parse(rawAnswer ?? {});
  const perScenario = maxScore / config.scenarios.length;
  let total = 0;
  let correctCount = 0;
  for (const scenario of config.scenarios) {
    const chosenOptionId = answer.choices[scenario.id];
    const option = scenario.options.find((o) => o.id === chosenOptionId);
    if (option?.correct) {
      total += perScenario;
      correctCount += 1;
    }
  }
  return { score: round(total), detail: { correctCount } };
}

// ---------------------------------------------------------------------------
// memory_cards — buka kartu, temukan semua pasangan.
// ---------------------------------------------------------------------------
const memoryCardsAnswerSchema = z.object({ matchedPairIds: z.array(z.string()).default([]), moves: z.number().int().min(0).default(0) });

function scoreMemoryCards(config: MemoryCardsConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = memoryCardsAnswerSchema.parse(rawAnswer ?? {});
  const validPairIds = new Set(config.pairs.map((p) => p.id));
  const matched = new Set(answer.matchedPairIds.filter((id) => validPairIds.has(id)));
  const fraction = clamp(matched.size / (config.pairs.length || 1), 0, 1);
  const idealMoves = config.pairs.length * 2;
  const efficiencyBonus = answer.moves > 0 ? clamp(idealMoves / answer.moves, 0, 1) * 0.1 : 0;
  return { score: round(clamp(fraction + efficiencyBonus, 0, 1) * maxScore), detail: { matched: matched.size, moves: answer.moves } };
}

// ---------------------------------------------------------------------------
// quick_reaction — tap target sebelum waktu reaksi habis.
// ---------------------------------------------------------------------------
const quickReactionAnswerSchema = z.object({ hits: z.array(z.string()).default([]), falseHits: z.number().int().min(0).default(0) });

function scoreQuickReaction(config: QuickReactionConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = quickReactionAnswerSchema.parse(rawAnswer ?? {});
  const targetIds = new Set(config.rounds.filter((r) => r.isTarget).map((r) => r.id));
  const hits = answer.hits.filter((id) => targetIds.has(id));
  const uniqueHits = new Set(hits);
  const fraction = clamp(uniqueHits.size / (targetIds.size || 1), 0, 1);
  const penalty = clamp(answer.falseHits * 0.05, 0, 0.3);
  return { score: round(clamp(fraction - penalty, 0, 1) * maxScore), detail: { hits: uniqueHits.size } };
}

// ---------------------------------------------------------------------------
// simulation — pilih opsi tiap langkah, dinilai dari bobot dampaknya.
// ---------------------------------------------------------------------------
const simulationAnswerSchema = z.object({ choices: z.record(z.string(), z.string()) });

function scoreSimulation(config: SimulationConfig, rawAnswer: unknown, maxScore: number): ScoreResult {
  const answer = simulationAnswerSchema.parse(rawAnswer ?? {});
  const perStep = maxScore / config.steps.length;
  let total = 0;
  for (const step of config.steps) {
    const chosenOptionId = answer.choices[step.id];
    const option = step.options.find((o) => o.id === chosenOptionId);
    total += (option?.impact ?? 0) * perStep;
  }
  return { score: round(total), detail: {} };
}

const SCORERS: {
  [K in QuestType]: (config: QuestConfigByType[K], answer: unknown, maxScore: number) => ScoreResult;
} = {
  tap_select: scoreTapSelect,
  hidden_object: scoreHiddenObject,
  budget_slider: scoreBudgetSlider,
  swipe_cards: scoreSwipeCards,
  match_pairs: scoreMatchPairs,
  timeline_sort: scoreTimelineSort,
  scenario_choice: scoreScenarioChoice,
  memory_cards: scoreMemoryCards,
  quick_reaction: scoreQuickReaction,
  simulation: scoreSimulation,
};

/**
 * Menghitung skor di server berdasarkan config_json quest (sumber kebenaran)
 * dan jawaban yang dikirim pemain. Skor yang dikirim client TIDAK PERNAH
 * dipakai langsung, supaya tidak bisa dipalsukan lewat Developer Tools.
 */
export function scoreQuestAnswer(
  questType: QuestType,
  config: unknown,
  answer: unknown,
  maxScore: number
): ScoreResult {
  const scorer = SCORERS[questType] as (config: unknown, answer: unknown, maxScore: number) => ScoreResult;
  const result = scorer(config, answer, maxScore);
  return { score: clamp(result.score, 0, maxScore), detail: result.detail };
}
