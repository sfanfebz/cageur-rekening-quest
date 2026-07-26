/**
 * Teori musik minimal buat BGM prosedural (bagian 30): konversi nada,
 * tabel skala/mode, dan chord diatonis. Semua nada direpresentasikan
 * sebagai nomor MIDI (integer) supaya gampang dioperasikan lalu
 * dikonversi ke frekuensi saat mau dibunyikan lewat Web Audio.
 */

export type ScaleName =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "harmonicMinor"
  | "majorPentatonic"
  | "minorPentatonic";

const SCALE_INTERVALS: Record<ScaleName, readonly number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  // Skala 5-nada khas riff game retro/chiptune -- kombinasi manapun dari
  // nada-nadanya tetap konsonan, jadi aman dipakai dengan sistem chord-tone
  // yang sama (diatonicTriad/diatonicSeventh) tanpa perlu logika khusus.
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
};

const NOTE_INDEX: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

/** "F#3" -> nomor MIDI (A4 = 69). */
export function noteNameToMidi(name: string): number {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);
  if (!match) throw new Error(`Invalid note name: ${name}`);
  const [, letter, octaveStr] = match;
  const idx = NOTE_INDEX[letter];
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + idx;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Ubah scale degree (0-based, boleh negatif/lebih dari panjang skala -
 * otomatis lompat oktaf) jadi nomor MIDI relatif ke root.
 */
export function scaleDegreeToMidi(rootMidi: number, scale: ScaleName, degree: number): number {
  const intervals = SCALE_INTERVALS[scale];
  const len = intervals.length;
  const octave = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  return rootMidi + octave * 12 + intervals[idx];
}

/** Triad diatonis (tumpuk tertian) mulai dari scale degree tertentu. */
export function diatonicTriad(rootMidi: number, scale: ScaleName, degree: number): number[] {
  return [0, 2, 4].map((offset) => scaleDegreeToMidi(rootMidi, scale, degree + offset));
}

/** Seventh chord diatonis (buat state yang butuh harmoni lebih kaya, mis. finale). */
export function diatonicSeventh(rootMidi: number, scale: ScaleName, degree: number): number[] {
  return [0, 2, 4, 6].map((offset) => scaleDegreeToMidi(rootMidi, scale, degree + offset));
}

/** Scale degree mana saja yang jadi chord tone dari sebuah chord (buat bobot pemilihan nada). */
export function chordToneDegrees(chordRootDegree: number): number[] {
  return [chordRootDegree, chordRootDegree + 2, chordRootDegree + 4];
}
