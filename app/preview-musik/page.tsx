"use client";

import { useState } from "react";
import { playBgm, stopBgm, type TrackDef } from "@/lib/bgm-engine";
import { HUB_TRACK, QUEST_TRACKS, QUEST_RESULT_TRACK, CAMPAIGN_FINALE_TRACK } from "@/lib/bgm-tracks";
import type { QuestType } from "@/lib/types";

/**
 * Halaman internal buat dengar-dengar semua 13 state musik BGM langsung
 * dari lib/bgm-tracks.ts -- bukan bagian dari alur pemain, tidak ditaut di
 * navigasi mana pun, tapi sengaja dibiarkan permanen (bukan rute test
 * sementara) supaya bisa dipakai ulang kapan saja mau evaluasi musik tanpa
 * perlu login/Supabase.
 */

const QUEST_LABELS: Record<QuestType, string> = {
  tap_select: "Tap & Pilih",
  hidden_object: "Cari Barang Tersembunyi",
  budget_slider: "Slider Anggaran",
  swipe_cards: "Swipe Kartu",
  match_pairs: "Cocokkan Pasangan",
  timeline_sort: "Urutkan Linimasa",
  scenario_choice: "Pilihan Skenario",
  memory_cards: "Kartu Memori",
  quick_reaction: "Reaksi Cepat",
  simulation: "Simulasi",
};

interface Entry {
  section: string;
  label: string;
  track: TrackDef;
  note: string;
}

const ENTRIES: Entry[] = [
  { section: "Halaman", label: "Game Hub", track: HUB_TRACK, note: "tidak diubah pada revisi ini" },
  ...(Object.keys(QUEST_LABELS) as QuestType[]).map((type) => ({
    section: "Tipe Quest (gameplay)",
    label: QUEST_LABELS[type],
    track: QUEST_TRACKS[type],
    note: "gaya chiptune 8-bit",
  })),
  { section: "Halaman", label: "Skor Quest (hasil per quest)", track: QUEST_RESULT_TRACK, note: "synth lebih tebal & hangat" },
  { section: "Halaman", label: "Klasemen / Capaian Campaign", track: CAMPAIGN_FINALE_TRACK, note: "synth paling tebal & megah" },
];

const SECTIONS = ["Halaman", "Tipe Quest (gameplay)"];

export default function PreviewMusikPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  function handlePlay(entry: Entry) {
    playBgm(entry.track);
    setPlayingId(entry.track.id);
  }

  function handleStop() {
    stopBgm();
    setPlayingId(null);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Preview Musik BGM</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        Halaman internal (tidak ditaut di navigasi) buat dengarkan semua state musik prosedural. Klik salah satu untuk
        memutar -- otomatis berhenti dari yang sedang jalan (tanpa tumpang tindih).
      </p>

      <button
        onClick={handleStop}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid #ccc",
          background: playingId ? "#fee2e2" : "#f3f4f6",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        ⏹ Stop
      </button>

      {SECTIONS.map((section) => (
        <div key={section} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
            {section}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ENTRIES.filter((e) => e.section === section).map((entry) => {
              const isPlaying = playingId === entry.track.id;
              return (
                <button
                  key={entry.track.id}
                  onClick={() => handlePlay(entry)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: isPlaying ? "2px solid #14b8a6" : "1px solid #e5e7eb",
                    background: isPlaying ? "#f0fdfa" : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>
                    <span style={{ fontWeight: 700 }}>
                      {isPlaying ? "▶ " : ""}
                      {entry.label}
                    </span>
                    <br />
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {entry.track.scale} · {entry.track.bpm} bpm · {entry.note}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
