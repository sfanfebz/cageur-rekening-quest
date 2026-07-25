import type { TrackDef } from "@/lib/bgm-engine";
import type { QuestType } from "@/lib/types";

/**
 * Data komposisi 13 state BGM (bagian 30). Tiap TrackDef murni parameter
 * musik (skala, progresi chord, peran voice) — nol file audio, semua
 * dibunyikan lewat bgm-engine.ts saat runtime.
 */

export const HUB_TRACK: TrackDef = {
  id: "hub",
  rootNote: "C3",
  scale: "ionian",
  bpm: 96,
  barsPerLoop: 8,
  chordDegrees: [0, 4, 5, 3, 5, 3, 0, 4],
  voices: [
    { role: "pad", oscType: "sine", octave: 0, gain: 0.11, stepInterval: 16, density: 1, gateRatio: 0.9, chordToneBias: 1, registerSpan: 0, chordStack: true },
    { role: "bass", oscType: "sine", octave: -1, gain: 0.13, stepInterval: 8, density: 1, gateRatio: 0.85, chordToneBias: 1, chordToneWeights: [0.75, 0.05, 0.2], registerSpan: 0 },
    { role: "arp", oscType: "triangle", octave: 1, gain: 0.07, stepInterval: 4, density: 0.8, gateRatio: 0.55, chordToneBias: 0.8, chordToneWeights: [0.4, 0.3, 0.3], registerSpan: 2 },
    { role: "lead", oscType: "sine", octave: 2, gain: 0.06, stepInterval: 4, density: 0.22, gateRatio: 0.6, chordToneBias: 0.6, registerSpan: 2 },
  ],
};

const TAP_SELECT_TRACK: TrackDef = {
  id: "tap_select",
  rootNote: "D3",
  scale: "lydian",
  bpm: 130,
  barsPerLoop: 2,
  chordDegrees: [0, 3],
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 4, density: 0.95, gateRatio: 0.5, chordToneBias: 1, chordToneWeights: [0.7, 0.1, 0.2], registerSpan: 0 },
    { role: "lead", oscType: "square", octave: 1, gain: 0.09, stepInterval: 2, density: 0.75, gateRatio: 0.35, chordToneBias: 0.85, registerSpan: 2, swingRatio: 0.57 },
    { role: "arp", oscType: "square", octave: 2, gain: 0.05, stepInterval: 1, density: 0.35, gateRatio: 0.2, chordToneBias: 0.5, registerSpan: 3, swingRatio: 0.58 },
  ],
};

const HIDDEN_OBJECT_TRACK: TrackDef = {
  id: "hidden_object",
  rootNote: "D3",
  scale: "dorian",
  bpm: 84,
  barsPerLoop: 8,
  chordDegrees: [0, 6, 5, 6],
  voices: [
    { role: "pad", oscType: "sine", octave: 0, gain: 0.09, stepInterval: 16, density: 1, gateRatio: 0.95, chordToneBias: 1, registerSpan: 0, chordStack: true },
    { role: "bass", oscType: "sine", octave: -1, gain: 0.07, stepInterval: 16, density: 1, gateRatio: 0.98, chordToneBias: 1, chordToneWeights: [1, 0, 0], registerSpan: 0 },
    { role: "lead", oscType: "sine", octave: 2, gain: 0.08, stepInterval: 8, density: 0.18, gateRatio: 0.25, chordToneBias: 0.5, registerSpan: 4 },
  ],
};

const BUDGET_SLIDER_TRACK: TrackDef = {
  id: "budget_slider",
  rootNote: "F3",
  scale: "ionian",
  bpm: 73,
  barsPerLoop: 4,
  chordDegrees: [0, 3, 0, 4],
  voices: [
    { role: "pad", oscType: "sine", octave: 0, gain: 0.12, stepInterval: 16, density: 1, gateRatio: 0.95, chordToneBias: 1, registerSpan: 0, chordStack: true },
    { role: "bass", oscType: "sine", octave: -1, gain: 0.14, stepInterval: 4, density: 1, gateRatio: 0.9, chordToneBias: 1, chordToneWeights: [0.85, 0.05, 0.1], registerSpan: 0 },
  ],
};

const SWIPE_CARDS_TRACK: TrackDef = {
  id: "swipe_cards",
  rootNote: "E3",
  scale: "aeolian",
  bpm: 146,
  barsPerLoop: 4,
  chordDegrees: [0, 6, 5, 4],
  voices: [
    { role: "bass", oscType: "sawtooth", octave: -1, gain: 0.13, stepInterval: 2, density: 1, gateRatio: 0.55, chordToneBias: 1, chordToneWeights: [0.8, 0.1, 0.1], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 0, gain: 0.08, stepInterval: 4, density: 0.9, gateRatio: 0.35, chordToneBias: 0.9, registerSpan: 1 },
    { role: "lead", oscType: "triangle", octave: 1, gain: 0.07, stepInterval: 1, density: 0.5, gateRatio: 0.4, chordToneBias: 0.7, registerSpan: 3 },
  ],
};

const MATCH_PAIRS_TRACK: TrackDef = {
  id: "match_pairs",
  rootNote: "D4",
  scale: "ionian",
  bpm: 113,
  barsPerLoop: 4,
  chordDegrees: [0, 4, 5, 2],
  voices: [
    { role: "arp", oscType: "sine", octave: 1, gain: 0.07, stepInterval: 2, density: 0.85, gateRatio: 0.35, chordToneBias: 0.7, registerSpan: 3, detuneCents: 6 },
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.08, stepInterval: 8, density: 0.9, gateRatio: 0.6, chordToneBias: 1, chordToneWeights: [0.8, 0.1, 0.1], registerSpan: 0 },
    { role: "lead", oscType: "sine", octave: 2, gain: 0.04, stepInterval: 1, density: 0.18, gateRatio: 0.15, chordToneBias: 0.4, registerSpan: 4 },
  ],
};

const TIMELINE_SORT_TRACK: TrackDef = {
  id: "timeline_sort",
  rootNote: "G3",
  scale: "ionian",
  bpm: 104,
  barsPerLoop: 4,
  chordDegrees: [0, 3, 4, 0],
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 4, density: 1, gateRatio: 0.4, chordToneBias: 1, chordToneWeights: [0.85, 0.05, 0.1], registerSpan: 0 },
    { role: "lead", oscType: "triangle", octave: 1, gain: 0.08, stepInterval: 4, density: 0.9, gateRatio: 0.55, chordToneBias: 0.3, registerSpan: 1 },
    { role: "arp", oscType: "square", octave: 0, gain: 0.04, stepInterval: 8, density: 0.7, gateRatio: 0.1, chordToneBias: 1, registerSpan: 0 },
  ],
};

const SCENARIO_CHOICE_TRACK: TrackDef = {
  id: "scenario_choice",
  rootNote: "D3",
  scale: "dorian",
  bpm: 68,
  barsPerLoop: 4,
  chordDegrees: [1, 4, 0, 0],
  timingHumanizePct: 0.09,
  voices: [
    { role: "pad", oscType: "sine", octave: 0, gain: 0.1, stepInterval: 16, density: 1, gateRatio: 0.97, chordToneBias: 1, registerSpan: 0, chordStack: true },
    { role: "lead", oscType: "sine", octave: 1, gain: 0.06, stepInterval: 8, density: 0.35, gateRatio: 0.6, chordToneBias: 0.55, registerSpan: 3 },
  ],
};

const MEMORY_CARDS_TRACK: TrackDef = {
  id: "memory_cards",
  rootNote: "A3",
  scale: "harmonicMinor",
  bpm: 94,
  barsPerLoop: 4,
  chordDegrees: [0, 5, 6, 0],
  voices: [
    { role: "arp", oscType: "sine", octave: 2, gain: 0.06, stepInterval: 2, density: 0.45, gateRatio: 0.4, chordToneBias: 0.6, registerSpan: 3, detuneCents: 5 },
    { role: "bass", oscType: "sine", octave: -1, gain: 0.06, stepInterval: 16, density: 1, gateRatio: 0.98, chordToneBias: 1, chordToneWeights: [1, 0, 0], registerSpan: 0 },
    { role: "lead", oscType: "triangle", octave: 3, gain: 0.03, stepInterval: 1, density: 0.12, gateRatio: 0.15, chordToneBias: 0.3, registerSpan: 5 },
  ],
};

const QUICK_REACTION_TRACK: TrackDef = {
  id: "quick_reaction",
  rootNote: "C3",
  scale: "aeolian",
  bpm: 168,
  barsPerLoop: 2,
  chordDegrees: [0, 6],
  voices: [
    { role: "bass", oscType: "square", octave: -1, gain: 0.11, stepInterval: 1, density: 0.95, gateRatio: 0.35, chordToneBias: 1, chordToneWeights: [0.6, 0, 0.4], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 1, gain: 0.05, stepInterval: 1, density: 0.6, gateRatio: 0.15, chordToneBias: 0.6, registerSpan: 1 },
  ],
};

const SIMULATION_TRACK: TrackDef = {
  id: "simulation",
  rootNote: "G3",
  scale: "mixolydian",
  bpm: 116,
  barsPerLoop: 4,
  chordDegrees: [0, 6, 3, 0],
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.12, stepInterval: 2, density: 0.9, gateRatio: 0.6, chordToneBias: 1, chordToneWeights: [0.7, 0.1, 0.2], registerSpan: 0 },
    { role: "pad", oscType: "sine", octave: 0, gain: 0.08, stepInterval: 8, density: 1, gateRatio: 0.9, chordToneBias: 1, chordToneWeights: [0.5, 0, 0.5], registerSpan: 0 },
    { role: "arp", oscType: "triangle", octave: 1, gain: 0.08, stepInterval: 2, density: 0.6, gateRatio: 0.45, chordToneBias: 0.65, registerSpan: 3 },
  ],
};

export const QUEST_TRACKS: Record<QuestType, TrackDef> = {
  tap_select: TAP_SELECT_TRACK,
  hidden_object: HIDDEN_OBJECT_TRACK,
  budget_slider: BUDGET_SLIDER_TRACK,
  swipe_cards: SWIPE_CARDS_TRACK,
  match_pairs: MATCH_PAIRS_TRACK,
  timeline_sort: TIMELINE_SORT_TRACK,
  scenario_choice: SCENARIO_CHOICE_TRACK,
  memory_cards: MEMORY_CARDS_TRACK,
  quick_reaction: QUICK_REACTION_TRACK,
  simulation: SIMULATION_TRACK,
};

/** State 12: layar skor per quest — pendek, meriah, register lebih cerah dari quest-nya. */
export const QUEST_RESULT_TRACK: TrackDef = {
  id: "quest_result",
  rootNote: "D4",
  scale: "ionian",
  bpm: 126,
  barsPerLoop: 2,
  chordDegrees: [3, 4],
  voices: [
    { role: "pad", oscType: "triangle", octave: 0, gain: 0.13, stepInterval: 8, density: 1, gateRatio: 0.85, chordToneBias: 1, registerSpan: 0, chordStack: true },
    { role: "arp", oscType: "sine", octave: 1, gain: 0.08, stepInterval: 1, density: 0.55, gateRatio: 0.35, chordToneBias: 0.7, registerSpan: 3, detuneCents: 4 },
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.09, stepInterval: 4, density: 0.9, gateRatio: 0.6, chordToneBias: 1, chordToneWeights: [0.8, 0.1, 0.1], registerSpan: 0 },
  ],
};

/** State 13: capaian akhir campaign + klasemen — paling megah & penuh harmoni. */
export const CAMPAIGN_FINALE_TRACK: TrackDef = {
  id: "campaign_finale",
  rootNote: "D3",
  scale: "ionian",
  bpm: 104,
  barsPerLoop: 8,
  chordDegrees: [0, 2, 3, 4, 0, 3, 4, 0],
  voices: [
    { role: "pad", oscType: "sine", octave: 0, gain: 0.14, stepInterval: 16, density: 1, gateRatio: 0.95, chordToneBias: 1, registerSpan: 0, chordStack: true, useSeventh: true },
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.14, stepInterval: 4, density: 1, gateRatio: 0.75, chordToneBias: 1, chordToneWeights: [0.75, 0.05, 0.2], registerSpan: 0 },
    { role: "lead", oscType: "triangle", octave: 1, gain: 0.09, stepInterval: 4, density: 0.75, gateRatio: 0.65, chordToneBias: 0.65, registerSpan: 2 },
    { role: "harmony", oscType: "sine", octave: 1, gain: 0.06, stepInterval: 8, density: 0.6, gateRatio: 0.7, chordToneBias: 0.55, registerSpan: 2 },
    { role: "arp", oscType: "sine", octave: 2, gain: 0.05, stepInterval: 2, density: 0.3, gateRatio: 0.3, chordToneBias: 0.6, registerSpan: 3, detuneCents: 5 },
  ],
};
