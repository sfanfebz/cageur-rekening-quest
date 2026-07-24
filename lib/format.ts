/**
 * Normalisasi nama: trim, spasi ganda jadi satu, lowercase.
 * " Budi  Santoso " -> "budi santoso"
 */
export function normalizeName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Rapikan nama asli untuk disimpan (trim + spasi ganda jadi satu, kapitalisasi asli dipertahankan). */
export function cleanFullName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, " ");
}

export function isNip00000(nip: string): boolean {
  return nip.trim() === "00000";
}

/**
 * Kunci unik pemain. NIP 00000 (non-organik/swakelola) dibedakan lewat nama
 * ternormalisasi karena banyak pegawai bisa memakai NIP yang sama.
 */
export function buildUniqueKey(nip: string, normalizedName: string): string {
  const trimmedNip = nip.trim();
  if (isNip00000(trimmedNip)) {
    return `00000:${normalizedName}`;
  }
  return trimmedNip;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return DATETIME_FORMATTER.format(date);
}

const BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Format tanggal + waktu lengkap sampai detik, tanpa kata sambung "pukul"
 * (Intl.DateTimeFormat id-ID otomatis menyisipkan "pukul" saat tanggal dan
 * jam digabung, jadi disusun manual di sini).
 */
export function formatDateTimeFull(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const bulan = BULAN_ID[date.getMonth()];
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${dd} ${bulan} ${yyyy}, ${hh}:${mi}:${ss}`;
}

export function clampPercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
