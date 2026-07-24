export interface CardTone {
  bg: string;
  border: string;
  text: string;
  solid: string;
}

/**
 * Palet warna yang dirotasi antar kartu game supaya tampilan terasa lebih
 * "game" (bukan formulir monoton satu warna). Nama kelas ditulis literal
 * (bukan digabung lewat template string) supaya tetap terdeteksi oleh
 * pemindaian content Tailwind.
 */
const PALETTE: CardTone[] = [
  { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-800", solid: "bg-teal-500" },
  { bg: "bg-gold-50", border: "border-gold-300", text: "text-gold-800", solid: "bg-gold-500" },
  { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-800", solid: "bg-sky-500" },
  { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-800", solid: "bg-rose-500" },
  { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-800", solid: "bg-violet-500" },
  { bg: "bg-lime-50", border: "border-lime-300", text: "text-lime-800", solid: "bg-lime-500" },
  { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", solid: "bg-amber-500" },
  { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-800", solid: "bg-cyan-500" },
];

export function cardTone(index: number): CardTone {
  return PALETTE[index % PALETTE.length];
}
