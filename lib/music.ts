"use client";

import { useEffect } from "react";
import type { QuestType } from "@/lib/types";

/**
 * Musik latar disintesis langsung di browser lewat Web Audio API (pola yang
 * sama dengan lib/sound.ts untuk efek suara) — jadi tidak perlu file audio
 * biner. Setiap "state" (hub, per jenis quest, layar skor per quest, layar
 * capaian akhir + klasemen) punya profil musik sendiri: tempo, skala nada,
 * bentuk gelombang, dan pola ritme yang berbeda-beda supaya karakternya
 * terasa sesuai dan tidak monoton di setiap layar.
 */

export type MusicState = "hub" | "quest-result" | "final-result" | `quest:${QuestType}`;

const MUSIC_MUTE_STORAGE_KEY = "crq_music_muted";
const TARGET_VOLUME = 0.15;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedContext) sharedContext = new AudioCtor();
  return sharedContext;
}

export function isMusicMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUSIC_MUTE_STORAGE_KEY) === "1";
}

export function setMusicMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUSIC_MUTE_STORAGE_KEY, muted ? "1" : "0");
  applyMuteToActiveTrack(muted);
}

export function toggleMusicMuted(): boolean {
  const next = !isMusicMuted();
  setMusicMuted(next);
  return next;
}

/** Pola nada dalam interval semitone dari akar (root); `null` = jeda/istirahat. */
interface MusicProfile {
  bpm: number;
  root: number; // frekuensi akar (Hz)
  stepsPerBar: number; // jumlah langkah per birama 4 ketuk
  lead: (number | null)[];
  leadWave: OscillatorType;
  leadGain: number;
  bass: (number | null)[];
  bassWave: OscillatorType;
  bassGain: number;
  /** Layar kord panjang (opsional) untuk kesan lebih penuh/epik. */
  pad?: (number[] | null)[];
  padGain?: number;
  noteLen: number; // porsi durasi 1 langkah yang dipakai untuk envelope not (0-1]
}

function noteFreq(root: number, semitone: number): number {
  return root * 2 ** (semitone / 12);
}

function playNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  attack = 0.012
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, time + duration);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + duration + 0.03);
}

interface ActiveTrack {
  profile: MusicProfile;
  masterGain: GainNode;
  ctx: AudioContext;
  timerId: number;
  nextNoteTime: number;
  leadStep: number;
  bassStep: number;
  padStep: number;
}

let active: ActiveTrack | null = null;
let currentStateKey: MusicState | null = null;

function scheduleTrack(track: ActiveTrack) {
  const { profile, ctx, masterGain } = track;
  const stepDur = 60 / profile.bpm / (profile.stepsPerBar / 4);
  while (track.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
    const leadDeg = profile.lead[track.leadStep % profile.lead.length];
    if (leadDeg !== null) {
      playNote(ctx, masterGain, noteFreq(profile.root, leadDeg), track.nextNoteTime, stepDur * profile.noteLen, profile.leadWave, profile.leadGain);
    }
    const bassDeg = profile.bass[track.bassStep % profile.bass.length];
    if (bassDeg !== null) {
      playNote(
        ctx,
        masterGain,
        noteFreq(profile.root / 2, bassDeg),
        track.nextNoteTime,
        stepDur * Math.min(profile.noteLen + 0.3, 1),
        profile.bassWave,
        profile.bassGain
      );
    }
    if (profile.pad) {
      const chord = profile.pad[track.padStep % profile.pad.length];
      if (chord) {
        const chordDur = stepDur * profile.stepsPerBar; // dering selama satu birama
        for (const semitone of chord) {
          playNote(ctx, masterGain, noteFreq(profile.root, semitone), track.nextNoteTime, chordDur, "sine", profile.padGain ?? 0.05, 0.4);
        }
      }
      track.padStep++;
    }
    track.leadStep++;
    track.bassStep++;
    track.nextNoteTime += stepDur;
  }
}

function applyMuteToActiveTrack(muted: boolean) {
  if (!active) return;
  const { masterGain, ctx } = active;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(muted ? 0 : TARGET_VOLUME, now + 0.15);
}

export function stopMusic(): void {
  if (active) {
    window.clearInterval(active.timerId);
    const { masterGain, ctx } = active;
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.25);
    window.setTimeout(() => {
      try {
        masterGain.disconnect();
      } catch {
        // node sudah terputus, aman diabaikan
      }
    }, 400);
    active = null;
  }
  currentStateKey = null;
}

/** Ganti musik latar ke state baru. Tidak melakukan apa-apa kalau state sama (hindari restart saat re-render). */
export function playMusicForState(state: MusicState | null): void {
  if (state === currentStateKey) return;
  stopMusic();
  currentStateKey = state;
  if (!state) return;

  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const profile = MUSIC_PROFILES[state];
  const masterGain = ctx.createGain();
  masterGain.gain.value = isMusicMuted() ? 0 : TARGET_VOLUME;
  masterGain.connect(ctx.destination);

  const track: ActiveTrack = {
    profile,
    masterGain,
    ctx,
    timerId: 0,
    nextNoteTime: ctx.currentTime + 0.05,
    leadStep: 0,
    bassStep: 0,
    padStep: 0,
  };
  track.timerId = window.setInterval(() => scheduleTrack(track), LOOKAHEAD_MS);
  active = track;
}

/** Hook: panggil di komponen halaman/layar supaya musik otomatis menyesuaikan state saat mount. */
export function useBackgroundMusic(state: MusicState): void {
  useEffect(() => {
    playMusicForState(state);
  }, [state]);
}

// Skala referensi (interval semitone dari akar) yang dipakai saat menyusun pola di bawah:
// Major: 0 2 4 5 7 9 11 12 | Major pentatonic: 0 2 4 7 9 12 | Natural minor: 0 2 3 5 7 8 10 12
// Minor pentatonic: 0 3 5 7 10 12 | Dorian: 0 2 3 5 7 9 10 12 | Mixolydian: 0 2 4 5 7 9 10 12

const MUSIC_PROFILES: Record<MusicState, MusicProfile> = {
  // Menu utama — ramah, ceria, tempo sedang, mudah didengar berulang-ulang.
  hub: {
    bpm: 108,
    root: 261.63, // C4
    stepsPerBar: 8,
    lead: [0, 4, 7, 12, 7, 4, 0, null, 2, 5, 9, 14, 9, 5, 2, null],
    leadWave: "triangle",
    leadGain: 0.5,
    bass: [0, null, null, null, 7, null, null, null, 9, null, null, null, 7, null, null, null],
    bassWave: "sine",
    bassGain: 0.4,
    noteLen: 0.82,
  },

  // Tap Select — ringan & lincah, seperti "menepuk" pilihan dengan cepat.
  "quest:tap_select": {
    bpm: 126,
    root: 440, // A4
    stepsPerBar: 8,
    lead: [0, 4, 7, 9, 7, 4, 2, null],
    leadWave: "triangle",
    leadGain: 0.48,
    bass: [0, null, null, null, 7, null, null, null],
    bassWave: "sine",
    bassGain: 0.36,
    noteLen: 0.6,
  },

  // Hidden Object — suasana mencari-cari, jarang & penasaran.
  "quest:hidden_object": {
    bpm: 96,
    root: 293.66, // D4
    stepsPerBar: 8,
    lead: [0, null, 3, null, 7, null, 5, null, null, 10, null, 7, null, 3, null, null],
    leadWave: "sine",
    leadGain: 0.42,
    bass: [0, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
    bassWave: "sine",
    bassGain: 0.3,
    noteLen: 0.9,
  },

  // Budget Slider — tenang & mantap, cocok untuk mengatur-atur angka.
  "quest:budget_slider": {
    bpm: 84,
    root: 349.23, // F4
    stepsPerBar: 4,
    lead: [0, 4, 7, 9, 7, 4, 2, 0],
    leadWave: "sine",
    leadGain: 0.44,
    bass: [0, null, 7, null, 5, null, 4, null],
    bassWave: "triangle",
    bassGain: 0.34,
    noteLen: 0.95,
  },

  // Swipe Cards (Checkout Battle) — cepat, mendesak, energik.
  "quest:swipe_cards": {
    bpm: 138,
    root: 329.63, // E4
    stepsPerBar: 8,
    lead: [0, 7, 4, 7, 9, 7, 4, null, 2, 9, 5, 9, 11, 9, 5, null],
    leadWave: "square",
    leadGain: 0.32,
    bass: [0, null, 0, null, 7, null, 7, null, 2, null, 2, null, 9, null, 9, null],
    bassWave: "sawtooth",
    bassGain: 0.3,
    noteLen: 0.5,
  },

  // Match Pairs — cerah & berkilau, seperti kartu yang saling berpasangan.
  "quest:match_pairs": {
    bpm: 116,
    root: 392.0, // G4
    stepsPerBar: 8,
    lead: [0, 4, 7, 12, 16, 12, 7, 4, 2, 7, 9, 14, 19, 14, 9, 7],
    leadWave: "triangle",
    leadGain: 0.4,
    bass: [0, null, null, null, 7, null, null, null, 2, null, null, null, 9, null, null, null],
    bassWave: "sine",
    bassGain: 0.32,
    noteLen: 0.55,
  },

  // Timeline Sort — mantap & berurutan, seperti langkah berbaris.
  "quest:timeline_sort": {
    bpm: 100,
    root: 261.63, // C4
    stepsPerBar: 8,
    lead: [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 9, 10, 12],
    leadWave: "sine",
    leadGain: 0.42,
    bass: [0, null, 4, null, 7, null, 4, null, 0, null, 5, null, 7, null, 10, null],
    bassWave: "triangle",
    bassGain: 0.34,
    noteLen: 0.75,
  },

  // Scenario Choice — reflektif, lebih pelan, ada jeda untuk "berpikir".
  "quest:scenario_choice": {
    bpm: 90,
    root: 220, // A3
    stepsPerBar: 8,
    lead: [0, null, 3, null, 7, null, 5, null, null, 8, null, 7, null, 3, null, null],
    leadWave: "sine",
    leadGain: 0.4,
    bass: [0, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
    bassWave: "sine",
    bassGain: 0.3,
    noteLen: 0.95,
  },

  // Memory Cards — misterius & berkilau di register tinggi.
  "quest:memory_cards": {
    bpm: 100,
    root: 440, // A4
    stepsPerBar: 8,
    lead: [12, 15, 19, 24, 19, 15, 12, null, 10, 15, 17, 22, 17, 15, 10, null],
    leadWave: "sine",
    leadGain: 0.34,
    bass: [0, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
    bassWave: "sine",
    bassGain: 0.26,
    noteLen: 0.7,
  },

  // Quick Reaction — cepat & mendesak, ketukan 16 rapat.
  "quest:quick_reaction": {
    bpm: 150,
    root: 329.63, // E4
    stepsPerBar: 16,
    lead: [0, 4, 7, 4, 0, 4, 7, 4, 2, 5, 9, 5, 2, 5, 9, 5],
    leadWave: "square",
    leadGain: 0.3,
    bass: [0, null, null, null, 7, null, null, null, 2, null, null, null, 9, null, null, null],
    bassWave: "square",
    bassGain: 0.28,
    noteLen: 0.42,
  },

  // Simulation — bersemangat & menjelajah, ritme bas yang aktif.
  "quest:simulation": {
    bpm: 118,
    root: 293.66, // D4
    stepsPerBar: 8,
    lead: [0, 4, 7, 11, 12, 11, 7, 4, 2, 5, 9, 12, 14, 12, 9, 5],
    leadWave: "triangle",
    leadGain: 0.42,
    bass: [0, 7, 0, 7, 5, 9, 5, 9, 2, 9, 2, 9, 7, 11, 7, 11],
    bassWave: "sawtooth",
    bassGain: 0.26,
    noteLen: 0.6,
  },

  // Layar skor per quest — singkat & meriah, register lebih tinggi & cerah.
  "quest-result": {
    bpm: 132,
    root: 523.25, // C5
    stepsPerBar: 8,
    lead: [0, 4, 7, 12, 16, 12, 7, 4],
    leadWave: "triangle",
    leadGain: 0.46,
    bass: [0, null, 7, null, 0, null, 7, null],
    bassWave: "sine",
    bassGain: 0.34,
    noteLen: 0.68,
  },

  // Capaian akhir campaign + klasemen — epik & penuh, ada lapisan kord panjang.
  "final-result": {
    bpm: 112,
    root: 261.63, // C4
    stepsPerBar: 8,
    lead: [0, 4, 7, 12, 9, 7, 4, 0, 4, 7, 12, 16, 12, 7, 4, 0],
    leadWave: "triangle",
    leadGain: 0.46,
    bass: [0, null, 7, null, 0, null, 7, null, 0, null, 7, null, 0, null, 7, null],
    bassWave: "sine",
    bassGain: 0.36,
    pad: [[0, 4, 7], null, null, null, null, null, null, null, [0, 5, 9], null, null, null, null, null, null, null],
    padGain: 0.05,
    noteLen: 0.8,
  },
};
