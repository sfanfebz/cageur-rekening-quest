import { z } from "zod";

export type QuestType = "tap_select" | "hidden_object" | "budget_slider" | "swipe_cards";
export type Quest = { id: string; code: string; title: string; subtitle: string; type: QuestType; maxScore: number; badge: string; icon: string; config: unknown };

const choice = z.object({ label: z.string(), healthy: z.boolean() });
export const questSchemas = {
  tap_select: z.object({ instruction: z.string(), choices: z.array(choice).min(1) }),
  hidden_object: z.object({ instruction: z.string(), targets: z.array(z.string()), decoys: z.array(z.string()) }),
  budget_slider: z.object({ instruction: z.string(), categories: z.array(z.object({ label: z.string(), ideal: z.number() })) }),
  swipe_cards: z.object({ instruction: z.string(), items: z.array(z.object({ label: z.string(), best: z.string() })) })
} satisfies Record<QuestType, z.ZodType>;

export function validQuest(quest: Quest) { return questSchemas[quest.type].safeParse(quest.config).success; }

export const initialCampaign = { code: "CR-C01", title: "Cek dan Atur Keuangan", description: "Cek kondisi keuangan, temukan bocor halus, atur budget, dan tahan checkout yang kurang perlu." };
export const quests: Quest[] = [
  { id: "q1", code: "Q001", title: "Dompet Cageur Scanner", subtitle: "Tap kebiasaan yang bikin rekening sehat", type: "tap_select", maxScore: 25, badge: "Dompet Cageur", icon: "◉", config: { instruction: "Tap semua kebiasaan yang bikin rekening makin sehat.", choices: [{ label: "Pengeluaran lebih kecil dari penghasilan", healthy: true }, { label: "Punya dana darurat", healthy: true }, { label: "Sering belanja impulsif", healthy: false }, { label: "Mencatat pengeluaran harian", healthy: true }, { label: "Tidak tahu total cicilan", healthy: false }, { label: "Punya tujuan keuangan", healthy: true }] } },
  { id: "q2", code: "Q002", title: "Bocor Halus Hunt", subtitle: "Temukan pengeluaran kecil yang kerap lolos", type: "hidden_object", maxScore: 25, badge: "Detektif Bocor Halus", icon: "⌕", config: { instruction: "Dalam 30 detik, tap pengeluaran kecil yang bisa jadi bocor halus.", targets: ["Kopi harian", "Jajan promo", "Checkout barang lucu", "Parkir kecil-kecil", "Flash sale", "Langganan jarang dipakai"], decoys: ["Makan harian", "Transportasi", "Listrik & internet", "Dana darurat"] } },
  { id: "q3", code: "Q003", title: "Budget Rush", subtitle: "Bagi 100 koin gaji dengan bijak", type: "budget_slider", maxScore: 20, badge: "Jago Atur Budget", icon: "▥", config: { instruction: "Kamu punya 100 koin gaji. Bagi ke pos yang tepat.", categories: [{ label: "Kebutuhan utama", ideal: 45 }, { label: "Cicilan & kewajiban", ideal: 20 }, { label: "Tabungan/dana darurat", ideal: 25 }, { label: "Hiburan/gaya hidup", ideal: 10 }] } },
  { id: "q4", code: "Q004", title: "Checkout Battle", subtitle: "Pilih Checkout, Tunda, atau Keluarkan", type: "swipe_cards", maxScore: 30, badge: "Anti Lapar Mata", icon: "↗", config: { instruction: "Swipe setiap barang ke keputusan paling bijak.", items: [{ label: "Obat", best: "Checkout" }, { label: "Dekorasi promo", best: "Keluarkan" }, { label: "Tas flash sale", best: "Tunda 24 Jam" }] } }
];
