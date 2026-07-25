"use client";

/**
 * Efek suara disintesis langsung di browser lewat Web Audio API (bagian 29),
 * jadi tidak perlu file audio biner. Kalau AudioContext tidak tersedia,
 * fungsi ini diam saja — UI tetap punya feedback visual (DING!/NICE!/dst).
 */

const MUTE_STORAGE_KEY = "crq_muted";
let sharedContext: AudioContext | null = null;

export function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedContext) sharedContext = new AudioCtor();
  return sharedContext;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

interface Tone {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function playTones(tones: Tone[]) {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.value = tone.freq;
    const startTime = now + tone.start;
    const endTime = startTime + tone.duration;
    const peakGain = tone.gain ?? 0.18;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(endTime + 0.02);
  }
}

export const sfx = {
  ding: () => playTones([{ freq: 880, start: 0, duration: 0.18, type: "sine" }, { freq: 1320, start: 0.06, duration: 0.16, type: "sine" }]),
  pop: () => playTones([{ freq: 520, start: 0, duration: 0.09, type: "triangle", gain: 0.16 }]),
  whoosh: () => playTones([{ freq: 220, start: 0, duration: 0.22, type: "sawtooth", gain: 0.08 }]),
  error: () => playTones([{ freq: 180, start: 0, duration: 0.22, type: "square", gain: 0.12 }]),
  badge: () =>
    playTones([
      { freq: 660, start: 0, duration: 0.14, type: "sine" },
      { freq: 880, start: 0.12, duration: 0.14, type: "sine" },
      { freq: 1100, start: 0.24, duration: 0.22, type: "sine" },
    ]),
  victory: () =>
    playTones([
      { freq: 523, start: 0, duration: 0.16, type: "sine" },
      { freq: 659, start: 0.14, duration: 0.16, type: "sine" },
      { freq: 784, start: 0.28, duration: 0.16, type: "sine" },
      { freq: 1046, start: 0.42, duration: 0.3, type: "sine" },
    ]),
};
