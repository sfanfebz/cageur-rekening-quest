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

// Instrumentasi 10 track quest sengaja dicondongkan ke palet chiptune ala
// konsol 8-bit klasik (bagian 30 revisi): kombinasi square+triangle (dekat
// dengan 2 kanal pulse + 1 kanal triangle NES), gate pendek/staccato biar
// terdengar "nge-blip", dan melodi berbasis pentatonic supaya riff-nya
// langsung kerasa gamey tanpa pernah tabrakan nada. Pad sine yang sustain
// panjang sengaja diminimalkan di sini -- itu ciri synth modern yang
// "kurang enak" dikeluhkan; kehangatan/lapisan synth yang lebih tebal
// disimpan khusus buat QUEST_RESULT_TRACK & CAMPAIGN_FINALE_TRACK di bawah.

const TAP_SELECT_TRACK: TrackDef = {
  id: "tap_select",
  rootNote: "D4",
  scale: "majorPentatonic",
  bpm: 132,
  barsPerLoop: 2,
  chordDegrees: [0, 3],
  timingHumanizePct: 0.02,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 4, density: 0.95, gateRatio: 0.4, chordToneBias: 1, chordToneWeights: [0.7, 0.1, 0.2], registerSpan: 0 },
    { role: "lead", oscType: "square", octave: 1, gain: 0.08, stepInterval: 2, density: 0.8, gateRatio: 0.28, chordToneBias: 0.85, registerSpan: 2, swingRatio: 0.56 },
    { role: "arp", oscType: "square", octave: 2, gain: 0.045, stepInterval: 1, density: 0.4, gateRatio: 0.16, chordToneBias: 0.6, registerSpan: 3, swingRatio: 0.58 },
  ],
};

const HIDDEN_OBJECT_TRACK: TrackDef = {
  id: "hidden_object",
  rootNote: "D3",
  scale: "minorPentatonic",
  bpm: 80,
  barsPerLoop: 4,
  chordDegrees: [0, 3],
  timingHumanizePct: 0.025,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.09, stepInterval: 8, density: 1, gateRatio: 0.5, chordToneBias: 1, chordToneWeights: [1, 0, 0], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 1, gain: 0.05, stepInterval: 4, density: 0.55, gateRatio: 0.22, chordToneBias: 0.55, registerSpan: 2 },
    { role: "lead", oscType: "square", octave: 2, gain: 0.045, stepInterval: 8, density: 0.22, gateRatio: 0.2, chordToneBias: 0.5, registerSpan: 3 },
  ],
};

const BUDGET_SLIDER_TRACK: TrackDef = {
  id: "budget_slider",
  rootNote: "F3",
  scale: "majorPentatonic",
  bpm: 76,
  barsPerLoop: 4,
  chordDegrees: [0, 3, 0, 2],
  timingHumanizePct: 0.02,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 4, density: 1, gateRatio: 0.45, chordToneBias: 1, chordToneWeights: [0.85, 0.05, 0.1], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 1, gain: 0.05, stepInterval: 4, density: 0.6, gateRatio: 0.22, chordToneBias: 0.75, registerSpan: 1 },
  ],
};

const SWIPE_CARDS_TRACK: TrackDef = {
  id: "swipe_cards",
  rootNote: "E3",
  scale: "minorPentatonic",
  bpm: 150,
  barsPerLoop: 4,
  chordDegrees: [0, 3, 2, 0],
  timingHumanizePct: 0.02,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 2, density: 1, gateRatio: 0.4, chordToneBias: 1, chordToneWeights: [0.8, 0.1, 0.1], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 0, gain: 0.08, stepInterval: 4, density: 0.9, gateRatio: 0.3, chordToneBias: 0.9, registerSpan: 1 },
    { role: "lead", oscType: "square", octave: 2, gain: 0.05, stepInterval: 1, density: 0.4, gateRatio: 0.22, chordToneBias: 0.7, registerSpan: 3 },
  ],
};

const MATCH_PAIRS_TRACK: TrackDef = {
  id: "match_pairs",
  rootNote: "D4",
  scale: "majorPentatonic",
  bpm: 116,
  barsPerLoop: 4,
  chordDegrees: [0, 3, 4, 2],
  timingHumanizePct: 0.02,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.09, stepInterval: 8, density: 0.9, gateRatio: 0.5, chordToneBias: 1, chordToneWeights: [0.8, 0.1, 0.1], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 1, gain: 0.06, stepInterval: 2, density: 0.85, gateRatio: 0.3, chordToneBias: 0.7, registerSpan: 3 },
    { role: "lead", oscType: "square", octave: 3, gain: 0.035, stepInterval: 1, density: 0.16, gateRatio: 0.14, chordToneBias: 0.4, registerSpan: 4 },
  ],
};

const TIMELINE_SORT_TRACK: TrackDef = {
  id: "timeline_sort",
  rootNote: "G3",
  scale: "majorPentatonic",
  bpm: 108,
  barsPerLoop: 4,
  chordDegrees: [0, 2, 3, 0],
  timingHumanizePct: 0.015,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 4, density: 1, gateRatio: 0.35, chordToneBias: 1, chordToneWeights: [0.85, 0.05, 0.1], registerSpan: 0 },
    { role: "lead", oscType: "square", octave: 1, gain: 0.07, stepInterval: 4, density: 0.9, gateRatio: 0.35, chordToneBias: 0.4, registerSpan: 1 },
    { role: "arp", oscType: "square", octave: 2, gain: 0.04, stepInterval: 8, density: 0.7, gateRatio: 0.14, chordToneBias: 1, registerSpan: 0 },
  ],
};

const SCENARIO_CHOICE_TRACK: TrackDef = {
  id: "scenario_choice",
  rootNote: "D3",
  scale: "dorian",
  bpm: 68,
  barsPerLoop: 4,
  chordDegrees: [1, 4, 0, 0],
  timingHumanizePct: 0.06,
  voices: [
    { role: "pad", oscType: "triangle", octave: 0, gain: 0.08, stepInterval: 8, density: 0.85, gateRatio: 0.3, chordToneBias: 1, registerSpan: 0, chordStack: true },
    { role: "lead", oscType: "square", octave: 1, gain: 0.05, stepInterval: 8, density: 0.35, gateRatio: 0.3, chordToneBias: 0.55, registerSpan: 3 },
  ],
};

const MEMORY_CARDS_TRACK: TrackDef = {
  id: "memory_cards",
  rootNote: "A3",
  scale: "harmonicMinor",
  bpm: 94,
  barsPerLoop: 4,
  chordDegrees: [0, 5, 6, 0],
  timingHumanizePct: 0.02,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.09, stepInterval: 8, density: 1, gateRatio: 0.4, chordToneBias: 1, chordToneWeights: [1, 0, 0], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 2, gain: 0.055, stepInterval: 2, density: 0.5, gateRatio: 0.22, chordToneBias: 0.6, registerSpan: 3 },
    { role: "lead", oscType: "square", octave: 3, gain: 0.03, stepInterval: 1, density: 0.14, gateRatio: 0.14, chordToneBias: 0.3, registerSpan: 5 },
  ],
};

const QUICK_REACTION_TRACK: TrackDef = {
  id: "quick_reaction",
  rootNote: "C3",
  scale: "minorPentatonic",
  bpm: 172,
  barsPerLoop: 2,
  chordDegrees: [0, 3],
  timingHumanizePct: 0.015,
  voices: [
    { role: "bass", oscType: "square", octave: -1, gain: 0.11, stepInterval: 1, density: 0.95, gateRatio: 0.3, chordToneBias: 1, chordToneWeights: [0.6, 0, 0.4], registerSpan: 0 },
    { role: "arp", oscType: "square", octave: 1, gain: 0.05, stepInterval: 1, density: 0.6, gateRatio: 0.14, chordToneBias: 0.6, registerSpan: 1 },
  ],
};

const SIMULATION_TRACK: TrackDef = {
  id: "simulation",
  rootNote: "G3",
  scale: "mixolydian",
  bpm: 118,
  barsPerLoop: 4,
  chordDegrees: [0, 6, 3, 0],
  timingHumanizePct: 0.025,
  voices: [
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.12, stepInterval: 2, density: 0.9, gateRatio: 0.5, chordToneBias: 1, chordToneWeights: [0.7, 0.1, 0.2], registerSpan: 0 },
    { role: "arp", oscType: "triangle", octave: 1, gain: 0.07, stepInterval: 2, density: 0.65, gateRatio: 0.35, chordToneBias: 0.65, registerSpan: 3 },
    { role: "lead", oscType: "square", octave: 2, gain: 0.05, stepInterval: 4, density: 0.4, gateRatio: 0.24, chordToneBias: 0.6, registerSpan: 2 },
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

/**
 * State 12: layar skor per quest. Kebalikan dari track quest di atas --
 * di sini justru diperkaya lapisan synth (bukan chip) supaya terasa hangat
 * dan "premium" saat hasil ditampilkan: pad bertumpuk 7th dengan 2 lapis
 * detune (shimmer/unison), harmony voice terpisah, gate lebih panjang
 * (legato, bukan staccato).
 */
export const QUEST_RESULT_TRACK: TrackDef = {
  id: "quest_result",
  rootNote: "D4",
  scale: "ionian",
  bpm: 120,
  barsPerLoop: 2,
  chordDegrees: [3, 4],
  timingHumanizePct: 0.03,
  voices: [
    { role: "pad", oscType: "triangle", octave: 0, gain: 0.13, stepInterval: 8, density: 1, gateRatio: 0.9, chordToneBias: 1, registerSpan: 0, chordStack: true, useSeventh: true, detuneCents: 7 },
    { role: "harmony", oscType: "sine", octave: 1, gain: 0.07, stepInterval: 8, density: 0.85, gateRatio: 0.85, chordToneBias: 0.6, registerSpan: 2, detuneCents: -6 },
    { role: "arp", oscType: "sine", octave: 2, gain: 0.06, stepInterval: 2, density: 0.55, gateRatio: 0.45, chordToneBias: 0.7, registerSpan: 3, detuneCents: 5 },
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.1, stepInterval: 4, density: 0.9, gateRatio: 0.7, chordToneBias: 1, chordToneWeights: [0.8, 0.1, 0.1], registerSpan: 0 },
  ],
};

/**
 * State 13: capaian akhir campaign + klasemen -- paling megah & penuh
 * harmoni. Lapisan synth ditambah lagi dari sebelumnya: dua pad bertumpuk
 * beda oktaf dan arah detune (unison lebar), harmony voice ekstra, semua
 * gate panjang/legato -- jauh dari kesan "chip", justru synth pad yang
 * paling tebal di seluruh state musik.
 */
export const CAMPAIGN_FINALE_TRACK: TrackDef = {
  id: "campaign_finale",
  rootNote: "D3",
  scale: "ionian",
  bpm: 100,
  barsPerLoop: 8,
  chordDegrees: [0, 2, 3, 4, 0, 3, 4, 0],
  timingHumanizePct: 0.035,
  voices: [
    { role: "pad", oscType: "sine", octave: 0, gain: 0.13, stepInterval: 16, density: 1, gateRatio: 0.97, chordToneBias: 1, registerSpan: 0, chordStack: true, useSeventh: true, detuneCents: 6 },
    { role: "pad", oscType: "triangle", octave: 1, gain: 0.07, stepInterval: 16, density: 1, gateRatio: 0.95, chordToneBias: 1, registerSpan: 0, chordStack: true, useSeventh: true, detuneCents: -8 },
    { role: "bass", oscType: "triangle", octave: -1, gain: 0.13, stepInterval: 4, density: 1, gateRatio: 0.8, chordToneBias: 1, chordToneWeights: [0.75, 0.05, 0.2], registerSpan: 0 },
    { role: "lead", oscType: "triangle", octave: 1, gain: 0.08, stepInterval: 4, density: 0.75, gateRatio: 0.7, chordToneBias: 0.65, registerSpan: 2 },
    { role: "harmony", oscType: "sine", octave: 2, gain: 0.055, stepInterval: 8, density: 0.65, gateRatio: 0.75, chordToneBias: 0.55, registerSpan: 2, detuneCents: 4 },
    { role: "arp", oscType: "sine", octave: 2, gain: 0.045, stepInterval: 2, density: 0.32, gateRatio: 0.35, chordToneBias: 0.6, registerSpan: 3, detuneCents: -5 },
  ],
};
