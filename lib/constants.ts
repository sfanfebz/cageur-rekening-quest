export const COPY = {
  appTitle: "CAGEUR REKENING QUEST",
  identity: {
    title: "SAMPURASUN! 👋",
    subtitle: "Kenalan dulu sebelum masuk ke Cageur Rekening Quest",
    intro:
      "Wilujeng sumping! Isi data singkat berikut supaya progres, skor, badge, dan ranking kamu bisa tercatat.",
    namePlaceholder: "Masukkan nama lengkap",
    nipPlaceholder: "Masukkan NIP",
    nipHint: "Silakan isi 00000 untuk pegawai non-organik/swakelola.",
    consent:
      "Saya memahami bahwa data digunakan untuk validasi partisipasi dan pencatatan progres permainan.",
    submit: "MASUK KE GAME HUB",
    loading: "Sakedap, Kang Cageur lagi cek data…",
    nameError: "Tong hilap isi nama lengkap dulu, ya.",
    nipError: "NIP wajib diisi dan hanya boleh berupa angka.",
    consentError: "Centang dulu persetujuan penggunaan data, ya.",
  },
  privacyNotice:
    "Data nama dan NIP hanya digunakan untuk validasi partisipasi, penyimpanan progres, dan pencatatan skor.",
  errors: {
    loading: "Sakedap, Kang Cageur lagi cek data…",
    validation: "Data belum sesuai. Cek deui nama dan NIP-nya, ya.",
    saveFailed:
      "Aduh, datanya belum berhasil disimpan. Coba cek koneksi lalu klik Simpan Lagi. Progres kamu tidak akan hilang.",
    noActiveCampaign: "Belum ada misi aktif saat ini. Tong hilap cek deui nanti, ya!",
    wrongPasscode: "Passcode belum cocok. Cek deui, ya.",
    generic: "Aduh, ada yang kurang pas. Coba lagi sakedap deui, ya.",
  },
  hub: {
    greeting: (name: string) => `Wilujeng sumping, ${name}!`,
    tabs: {
      current: "Misi Saat Ini",
      upcoming: "Segera Hadir",
      history: "Riwayat Misi",
    },
    viewFullLeaderboard: "Lihat Klasemen Lengkap",
    newCampaignBanner: {
      title: "MISI BARU TERBUKA! 🎉",
      text: (name: string) =>
        `Wilujeng sumping deui, ${name}! Kang Cageur punya rangkaian misi baru yang belum kamu selesaikan.`,
      cta: "MULAI MISI BARU",
    },
    transitionBanner: "Misi ini geus kelar waktuna, tapi aya misi baru keur kamu!",
  },
  questCta: {
    start: "MULAI MISI",
    resume: "LANJUTKAN MISI",
    viewResult: "LIHAT HASIL",
    startNewCampaign: "MULAI MISI BARU",
  },
  questCardStatus: {
    completed: "Selesai",
    started: "Lanjutkan",
    available: "Mulai",
    locked: "Terkunci",
    upcoming: "Segera Hadir",
  },
  result: {
    title: "MISI SELESAI! 🎉",
    categories: {
      high: "REKENING CAGEUR 🏆",
      mid: "DOMPET MULAI RAPIH 💪",
      low: "MULAI DARI LANGKAH KECIL 🌱",
    },
    ctaLeaderboard: "Lihat Klasemen",
    ctaHub: "Kembali ke Game Hub",
    ctaShare: "Bagikan Hasil",
  },
  leaderboard: {
    activeLabel: "KLASEMEN CAMPAIGN SAAT INI",
    archivedLabel: "KLASEMEN AKHIR CAMPAIGN",
    yourPosition: (rank: number, total: number) => `Posisi kamu saat ini: #${rank} dari ${total} peserta.`,
  },
  full: {
    modalTitle: "Masukkan passcode untuk lihat klasemen lengkap",
    passcodePlaceholder: "Passcode",
    submit: "BUKA KLASEMEN",
    exportPdf: "Export ke PDF",
  },
  closingMessage:
    "Tong hilap, keuangan sehat dimulai dari kebiasaan kecil yang dilakukan konsisten. Hayu, makin cageur rekeningna!",
} as const;

export function resultCategory(percent: number): { label: string; tier: "high" | "mid" | "low" } {
  if (percent >= 80) return { label: COPY.result.categories.high, tier: "high" };
  if (percent >= 50) return { label: COPY.result.categories.mid, tier: "mid" };
  return { label: COPY.result.categories.low, tier: "low" };
}
