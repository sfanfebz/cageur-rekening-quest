export interface CardTone {
  bg: string;
  border: string;
  text: string;
  solid: string;
}

/**
 * Palet warna yang dirotasi antar kartu game. Dibatasi hanya pada warna
 * brand (teal/gold/navy) sesuai design system — hijau dan merah sengaja
 * TIDAK dipakai di sini karena keduanya direservasi khusus untuk umpan
 * balik benar/salah (bagian 2 & 4 pada brief desain), bukan dekorasi.
 */
const PALETTE: CardTone[] = [
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", solid: "bg-teal-500" },
  { bg: "bg-gold-50", border: "border-gold-200", text: "text-gold-700", solid: "bg-gold-400" },
  { bg: "bg-navy-50", border: "border-navy-200", text: "text-navy-800", solid: "bg-navy-600" },
];

export function cardTone(index: number): CardTone {
  return PALETTE[index % PALETTE.length];
}
