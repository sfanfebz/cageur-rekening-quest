"use client";

import { useEffect } from "react";
import { getContext } from "@/lib/sound";
import {
  chordToneDegrees,
  diatonicSeventh,
  diatonicTriad,
  midiToFreq,
  noteNameToMidi,
  scaleDegreeToMidi,
  type ScaleName,
} from "@/lib/music-theory";

/**
 * Engine BGM prosedural (bagian 30). Berbeda dari sfx di lib/sound.ts yang
 * cuma bunyi sekali, di sini tiap TrackDef adalah "data komposisi" (skala,
 * progresi chord, peran tiap voice) yang dijadwalkan berulang lewat
 * look-ahead scheduler ala Web Audio, plus humanize timing/gain/detune dan
 * variasi motif ringan tiap siklus loop biar tidak monoton — tanpa file
 * audio sama sekali.
 */

export type VoiceRole = "bass" | "pad" | "arp" | "lead" | "harmony";

export interface VoiceDef {
  role: VoiceRole;
  oscType: OscillatorType;
  /** Offset oktaf (x12 semitone) relatif ke root note track. */
  octave: number;
  gain: number;
  /** Voice ini main tiap kelipatan N step grid 16th-note. */
  stepInterval: number;
  /** Peluang [0,1] voice benar-benar bunyi di step yang eligible. */
  density: number;
  /** Fraksi [0,1] dari durasi stepInterval yang dipakai untuk gate/hold note. */
  gateRatio: number;
  /** Detune lapisan kedua (cent) buat efek shimmer/chorus tipis. */
  detuneCents?: number;
  /** Peluang [0,1] pilih chord tone vs passing tone (dilewati kalau chordStack). */
  chordToneBias: number;
  /** Bobot [root, third, fifth] saat pilih chord tone. Default rata. */
  chordToneWeights?: [number, number, number];
  /** Rentang scale-degree buat wandering passing tone (dan bass sesekali). */
  registerSpan: number;
  /** 0.5 = straight; >0.5 = swing di sub-step ganjil. */
  swingRatio?: number;
  /** true = bunyikan seluruh chord sekaligus (buat pad/harmony), bukan 1 nada pilihan. */
  chordStack?: boolean;
  /** Saat chordStack, sertakan 7th (harmoni lebih kaya, mis. finale). */
  useSeventh?: boolean;
}

export interface TrackDef {
  id: string;
  /** mis. "C4" */
  rootNote: string;
  scale: ScaleName;
  bpm: number;
  beatsPerBar?: number;
  /** Panjang siklus loop dalam bar sebelum variasi motif berulang. */
  barsPerLoop: number;
  /** Scale degree root chord per bar (di-modulo kalau lebih pendek dari barsPerLoop). */
  chordDegrees: number[];
  voices: VoiceDef[];
  /** Persentase (dari 1 beat) jitter timing. Default 0.045. */
  timingHumanizePct?: number;
}

const MUSIC_MUTE_STORAGE_KEY = "crq_music_muted";

/** Mute musik latar terpisah dari mute efek suara (lib/sound.ts) -- ada tombolnya sendiri di header. */
export function isMusicMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUSIC_MUTE_STORAGE_KEY) === "1";
}

export function setMusicMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUSIC_MUTE_STORAGE_KEY, muted ? "1" : "0");
}

export function toggleMusicMuted(): boolean {
  const next = !isMusicMuted();
  setMusicMuted(next);
  return next;
}

const STEPS_PER_BEAT = 4;
const SCHEDULE_AHEAD_TIME = 0.15;
const LOOKAHEAD_INTERVAL_MS = 30;
const BASE_MASTER_GAIN = 0.5;
const FADE_MS = 160;

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickChordTone(tones: number[], weights?: [number, number, number]): number {
  if (!weights) return tones[Math.floor(Math.random() * tones.length)];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < tones.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return tones[i];
  }
  return tones[tones.length - 1];
}

class TrackPlayer {
  private readonly rootMidi: number;
  private readonly beatsPerBar: number;
  private readonly secondsPerStep: number;
  private readonly totalStepsPerLoop: number;
  private timerId: number | null = null;
  private globalStep = 0;
  private nextStepTime = 0;

  constructor(
    private readonly track: TrackDef,
    private readonly ctx: AudioContext,
    private readonly masterGain: GainNode,
  ) {
    this.rootMidi = noteNameToMidi(track.rootNote);
    this.beatsPerBar = track.beatsPerBar ?? 4;
    this.secondsPerStep = 60 / track.bpm / STEPS_PER_BEAT;
    this.totalStepsPerLoop = Math.max(1, track.barsPerLoop * this.beatsPerBar * STEPS_PER_BEAT);
  }

  start(): void {
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.tick();
  }

  stop(): void {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private tick = (): void => {
    while (this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      this.scheduleStep(this.globalStep, this.nextStepTime);
      this.nextStepTime += this.secondsPerStep;
      this.globalStep += 1;
    }
    this.timerId = window.setTimeout(this.tick, LOOKAHEAD_INTERVAL_MS);
  };

  private scheduleStep(step: number, time: number): void {
    if (isMusicMuted()) return;

    const stepsPerBar = this.beatsPerBar * STEPS_PER_BEAT;
    const stepInLoop = step % this.totalStepsPerLoop;
    const barInLoop = Math.floor(stepInLoop / stepsPerBar);
    const loopCount = Math.floor(step / this.totalStepsPerLoop);
    const variation = loopCount % 4;
    const chordRootDegree = this.track.chordDegrees[barInLoop % this.track.chordDegrees.length];
    const isDownbeat = stepInLoop % stepsPerBar === 0;
    const accent = isDownbeat ? 1.12 : 1;
    const timingHumanize = this.track.timingHumanizePct ?? 0.045;

    for (const voice of this.track.voices) {
      if (stepInLoop % voice.stepInterval !== 0) continue;

      let density = voice.density;
      if (voice.role === "lead" || voice.role === "arp") {
        density = Math.min(1, density + (variation === 2 ? 0.15 : variation === 0 ? -0.1 : 0));
      }
      if (Math.random() > density) continue;

      let swingOffset = 0;
      if (voice.swingRatio && voice.swingRatio !== 0.5) {
        const subStepIndex = Math.floor(stepInLoop / voice.stepInterval);
        if (subStepIndex % 2 === 1) {
          swingOffset = (voice.swingRatio - 0.5) * 2 * this.secondsPerStep * voice.stepInterval;
        }
      }
      const jitter = randRange(-timingHumanize, timingHumanize) * (60 / this.track.bpm);
      const startTime = time + swingOffset + jitter;
      const duration = this.secondsPerStep * voice.stepInterval * voice.gateRatio * randRange(0.88, 1.0);
      const voiceRootMidi = this.rootMidi + voice.octave * 12;

      if (voice.chordStack) {
        const tones = voice.useSeventh
          ? diatonicSeventh(voiceRootMidi, this.track.scale, chordRootDegree)
          : diatonicTriad(voiceRootMidi, this.track.scale, chordRootDegree);
        const perNoteGain = (voice.gain * randRange(0.9, 1.05) * accent) / tones.length;
        for (const midi of tones) {
          this.playNote(midiToFreq(midi), startTime, duration, voice.oscType, perNoteGain, voice.detuneCents);
        }
        continue;
      }

      let degree: number;
      if (Math.random() < voice.chordToneBias) {
        degree = pickChordTone(chordToneDegrees(chordRootDegree), voice.chordToneWeights);
      } else {
        degree = chordRootDegree + Math.round(randRange(-voice.registerSpan, voice.registerSpan));
      }
      if ((voice.role === "lead" || voice.role === "arp") && variation === 1) degree += 2;
      else if ((voice.role === "lead" || voice.role === "arp") && variation === 3) degree -= 1;

      const midi = scaleDegreeToMidi(voiceRootMidi, this.track.scale, degree);
      const gain = voice.gain * randRange(0.85, 1.15) * accent;
      this.playNote(midiToFreq(midi), startTime, duration, voice.oscType, gain, voice.detuneCents);
    }
  }

  private playNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    detuneCents?: number,
  ): void {
    const layers = detuneCents ? [0, detuneCents] : [0];
    for (const cents of layers) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      if (cents) osc.detune.value = cents;
      const g = peakGain / layers.length;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(g, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gainNode).connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    }
  }
}

let sharedMasterGain: GainNode | null = null;
let activePlayer: TrackPlayer | null = null;
let activeTrackId: string | null = null;
let playRequestSeq = 0;

function ensureMasterGain(ctx: AudioContext): GainNode {
  if (!sharedMasterGain) {
    sharedMasterGain = ctx.createGain();
    sharedMasterGain.gain.value = 0;
    sharedMasterGain.connect(ctx.destination);
  }
  return sharedMasterGain;
}

export function playBgm(track: TrackDef): void {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  if (!ctx) return;
  if (activeTrackId === track.id) return;

  const masterGain = ensureMasterGain(ctx);
  const previousPlayer = activePlayer;
  const requestId = (playRequestSeq += 1);
  activeTrackId = track.id;
  activePlayer = null;

  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + FADE_MS / 1000);

  window.setTimeout(() => {
    previousPlayer?.stop();
    if (requestId !== playRequestSeq) return;

    const player = new TrackPlayer(track, ctx, masterGain);
    activePlayer = player;

    const begin = () => {
      if (requestId !== playRequestSeq) return;
      const t = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(BASE_MASTER_GAIN, t + FADE_MS / 1000);
      player.start();
    };

    if (ctx.state === "suspended") {
      const unlock = () => {
        ctx.resume().then(begin).catch(() => {});
      };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    } else {
      begin();
    }
  }, FADE_MS);
}

export function stopBgm(): void {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  const player = activePlayer;
  const requestId = (playRequestSeq += 1);
  activeTrackId = null;
  activePlayer = null;

  if (ctx && sharedMasterGain) {
    const now = ctx.currentTime;
    sharedMasterGain.gain.cancelScheduledValues(now);
    sharedMasterGain.gain.setValueAtTime(sharedMasterGain.gain.value, now);
    sharedMasterGain.gain.linearRampToValueAtTime(0, now + FADE_MS / 1000);
  }
  window.setTimeout(() => {
    if (requestId === playRequestSeq) player?.stop();
  }, FADE_MS);
}

/** Hook React: mainkan track selama komponen mount, ganti track kalau `track` berubah. */
export function useBgm(track: TrackDef | null): void {
  useEffect(() => {
    if (!track) return;
    playBgm(track);
    return () => stopBgm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);
}
