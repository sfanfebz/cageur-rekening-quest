# Cageur Rekening Quest — Dokumentasi Lengkap

Game edukasi literasi keuangan berbasis web (mobile-first) untuk program
**Change Program BI Jabar**. Pemain menyelesaikan rangkaian "quest" mini-game
seputar keuangan pribadi dalam sebuah "campaign", mengumpulkan skor & badge,
lalu bisa membagikan hasilnya sebagai kartu gambar.

Tidak ada admin panel — semua konten (campaign, quest) dikelola langsung
lewat Supabase (Table Editor atau script SQL). Lihat `docs/petunjuk-teknis.md`
untuk panduan operasionalnya.

---

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Bahasa | TypeScript |
| Styling | Tailwind CSS, font Baloo 2 (display) + Nunito (body) |
| Database | Supabase (PostgreSQL) — diakses lewat service-role key, tanpa ORM |
| Validasi | Zod (skema `config_json` per quest, payload API) |
| Audio | Web Audio API murni (sintesis prosedural, tanpa file audio biner) |
| PDF/QR | `jspdf` + `jspdf-autotable` (ekspor klasemen), `qrcode` (kartu hasil) |
| Hosting | Vercel (lihat `docs/deployment.md`) |

Tidak ada state management library eksternal (Redux/Zustand) — state cukup
`useState`/`useEffect` lokal per komponen, karena aplikasinya sequential
(satu quest per layar) dan sumber kebenaran selalu di server/database.

## 2. Arsitektur

```
Browser (Client Components)
   │  fetch() ke Route Handler
   ▼
Next.js Route Handler / Server Component  (app/**)
   │  service-role key (bypass RLS, tidak pernah ke browser)
   ▼
Supabase Postgres (RLS default-deny, tanpa policy publik)
```

Prinsip keamanan inti: **Row Level Security aktif di semua tabel dengan
default deny, dan tidak ada policy untuk role `anon`/`authenticated`.** Semua
baca/tulis data lewat Route Handler & Server Component di server memakai
`SUPABASE_SERVICE_ROLE_KEY`, yang otomatis melewati RLS. Browser tidak pernah
memegang key ini, jadi aplikasi tetap aman meski tanpa policy publik sama
sekali.

Skor **selalu dihitung ulang di server** dari `config_json` quest (lihat
§6) berdasarkan jawaban mentah yang dikirim client — skor yang dikirim
langsung dari client tidak pernah dipercaya begitu saja.

## 3. Model Data

Skema lengkap: `supabase/schema.sql`. Enam tabel inti:

```
participants ──┬──< participant_campaign_progress >──┬── campaigns
               │                                       │
               └──< participant_quest_progress >───┬───┤
                                                     │   │
                                              quests ┴───┘
                                                (via campaign_quests)
```

| Tabel | Fungsi |
|---|---|
| `participants` | Identitas pemain: `full_name`, `nip`, `normalized_name`, `unique_key` (kunci unik — NIP langsung untuk pegawai organik, `00000:nama` untuk non-organik/swakelola karena banyak yang berbagi NIP `00000`) |
| `campaigns` | Satu putaran program. Status `draft`\|`upcoming`\|`active`\|`archived`\|`disabled`. **Hanya boleh ada 1 campaign `active`** (dijaga unique index) |
| `quests` | Satu mini-game. `quest_type` menentukan komponen game + skema `config_json`-nya (§6). `status` sama seperti campaign, plus `version` untuk penomoran ulang konten & `allow_replay` |
| `campaign_quests` | Tabel penghubung: quest mana ada di campaign mana, `order_index`, `is_required`, `unlock_rule` (`independent`\|`sequential`\|`prerequisite`\|`scheduled`), `prerequisite_quest_ids[]` |
| `participant_campaign_progress` | Ringkasan progres 1 peserta di 1 campaign: status, `total_score`/`max_score` (di-cache, di-refresh tiap quest selesai — lihat §6 catatan penting), `completed_quest_count` |
| `participant_quest_progress` | Progres per quest per peserta: status, skor, `answer_data_json` (jawaban mentah, untuk audit) |

Semua tabel punya trigger `set_updated_at()` otomatis. `pgcrypto` dipakai
untuk `gen_random_uuid()` sebagai primary key.

## 4. Alur Pemain End-to-End

1. **Landing (`/`)** — form identitas (nama + NIP). Tidak ada password.
   `POST /api/identity` meng-upsert baris `participants` lalu menandatangani
   cookie sesi (lihat §5) dan redirect ke `/hub`.
2. **Game Hub (`/hub`)** — dashboard: campaign aktif, progres, badge yang
   sudah diraih, tab riwayat campaign lama, akses ke Klasemen. Musik latar
   mulai di sini (§7).
3. **Quest (`/campaign/[code]/quest/[questCode]`)** — merender komponen game
   sesuai `quest_type` lewat `components/quest/registry.tsx`. Selesai main →
   `POST /api/quest/complete` → server menghitung skor ulang (§6), menyimpan
   `participant_quest_progress`, lalu memanggil `recomputeAndSaveCampaignProgress`
   untuk me-refresh ringkasan campaign.
4. **Hasil per quest** — ditampilkan inline di halaman yang sama (fase
   `result` pada `QuestRunner`), lanjut ke quest berikutnya atau ke halaman
   hasil akhir kalau campaign baru saja selesai.
5. **Hasil Akhir (`/campaign/[code]/result`)** — skor total, badge, kartu
   hasil shareable (§8).
6. **Klasemen (`/klasemen` atau `/campaign/[code]/leaderboard`)** — daftar
   ringkas (top 5) tanpa passcode; "Klasemen Lengkap" butuh
   `LEADERBOARD_PASSCODE` dan bisa diekspor PDF.

## 5. Sesi & Keamanan

- **Tidak ada password.** Sesi cukup cookie `crq_session` berisi
  `participantId` + tanda tangan HMAC-SHA256 (`SESSION_SECRET`), diverifikasi
  dengan `timingSafeEqual` supaya tahan timing attack (`lib/session.ts`).
  Cookie `httpOnly`, `sameSite=lax`, umur 180 hari.
- **NIP `00000`** = pegawai non-organik/swakelola. Karena banyak orang bisa
  memakai NIP yang sama, kunci unik peserta jadi `00000:<nama ternormalisasi>`
  (lowercase, spasi dirapikan) — lihat `lib/format.ts: buildUniqueKey()`.
- Endpoint publik (`/api/leaderboard/full`, halaman klasemen) sengaja tidak
  pernah mengembalikan `nip`, `unique_key`, atau `answer_data_json`.

## 6. Sistem Quest — 10 Tipe

Tiap `quest_type` punya: (a) skema `config_json` sendiri (divalidasi Zod,
lihat `lib/quest-config-schemas.ts` — kalau tidak valid, quest otomatis
disembunyikan dari pemain tanpa membuat aplikasi crash), (b) komponen game
di `components/quest/`, dan (c) fungsi scoring sendiri di `lib/scoring.ts`
yang menghitung skor 0..`maxScore` dari jawaban mentah pemain.

Template `config_json` siap-pakai untuk semua tipe: `docs/quest-config-templates.md`.

| `quest_type` | Gameplay | Logika skor (ringkas) |
|---|---|---|
| `tap_select` | Tap semua kartu "sehat", hindari yang tidak sehat | `(benar − salah) / total_sehat`, di-clamp 0–1 |
| `hidden_object` | Cari `targets` dalam batas waktu, hindari `decoys` | `target_unik_ditemukan / total_target` |
| `budget_slider` | Bagi koin ke beberapa kategori (zona ideal/waspada/merah) | Rata per kategori: zona hijau = skor penuh, kuning = 50%, merah = 0%; penalti 10% kalau total alokasi ≠ `totalCoins` |
| `swipe_cards` | Arahkan tiap barang ke keputusan terbaik | `benar / total` + bonus combo streak beruntun (maks +15%) |
| `match_pairs` | Jodohkan pasangan kiri-kanan | `pasangan_benar / total_pasangan` |
| `timeline_sort` | Urutkan langkah sesuai `order` yang benar | Posisi yang tepat persis / total item |
| `scenario_choice` | Skenario pilihan ganda bertingkat | Rata per skenario, penuh kalau opsi `correct` dipilih |
| `memory_cards` | Kartu memori klasik | `pasangan_ditemukan / total` + bonus efisiensi langkah (maks +10%) |
| `quick_reaction` | Tap target dalam `reactionWindowMs`, hindari non-target | `target_kena / total_target` − penalti 5%/salah-tap (maks −30%) |
| `simulation` | Pilih opsi tiap langkah, dinilai bobot `impact` (0–1) | Rata tertimbang `impact` opsi yang dipilih tiap langkah |

Field `badge` bersifat opsional di semua tipe (`{ code, title }`). Badge
diberikan **unconditional** setiap kali quest yang punya konfigurasi badge
selesai dikerjakan — tidak ada ambang skor minimum.

**⚠️ Catatan penting soal konten dinamis:** `participant_campaign_progress.total_score`/`max_score`
(dipakai klasemen) hanya di-refresh saat peserta menyelesaikan quest
(`recomputeAndSaveCampaignProgress` cuma dipanggil dari
`POST /api/quest/complete`). Kalau quest baru ditambahkan ke campaign yang
sebagian pesertanya **sudah** berstatus `completed`, baris tersimpan mereka
TIDAK otomatis ikut ter-update sampai mereka melakukan aksi baru. Lihat
`docs/petunjuk-teknis.md` §"Menambah konten ke campaign yang sudah berjalan".

## 7. Musik Latar Prosedural

Semua musik & efek suara disintesis langsung di browser lewat Web Audio
API — **tidak ada file audio biner sama sekali**.

- `lib/sound.ts` — efek suara pendek (ding/pop/whoosh/badge/victory), satu
  `AudioContext` bersama untuk seluruh sesi.
- `lib/music-theory.ts` — util teori musik murni: konversi nada↔frekuensi,
  tabel skala (Ionian/Dorian/Phrygian/Lydian/Mixolydian/Aeolian/Harmonic
  Minor), pembangun chord diatonis dari scale degree.
- `lib/bgm-engine.ts` — scheduler *look-ahead* Web Audio (pola industri
  standar untuk musik presisi di browser): humanize timing/gain/detune,
  variasi motif ringan tiap siklus loop, transisi antar track yang selalu
  **sinkron** (track lama langsung berhenti sebelum yang baru mulai — tidak
  ada timer terpisah yang bisa balapan), dan mekanisme unlock autoplay
  (browser mewajibkan gesture pertama sebelum audio bisa bunyi).
- `lib/bgm-tracks.ts` — 13 definisi track (data komposisi murni: BPM, skala,
  progresi chord, peran tiap voice) untuk: Game Hub, 10 jenis quest, layar
  skor per quest, dan layar capaian akhir + klasemen.
- Mute suara & mute musik terpisah (dua tombol di header, dua
  `localStorage` key berbeda: `crq_muted` untuk SFX, `crq_music_muted`
  untuk BGM).

## 8. Kartu Hasil Shareable

`lib/share-card.ts` — membangun gambar PNG 1080×1350 (potret) sepenuhnya di
browser lewat Canvas API (tidak ada data yang dikirim ke server untuk
render gambar ini). Isinya: logo program, wordmark, skor, kategori hasil,
badge yang diraih (grid dinamis, meluber ke baris berikutnya kalau lebih
dari 4), QR code ke aplikasi, dan credit program di footer.

Alur berbagi (`components/campaign/result-view.tsx`): klik "Bagikan Hasil"
→ generate kartu → tampil **preview di popup** (`components/ui/modal.tsx`)
→ baru saat klik "Bagikan Sekarang" barulah `navigator.share()` (native share
sheet) dipanggil, dengan fallback unduh PNG + salin caption ke clipboard
kalau browser tidak mendukung Web Share API.

## 9. Struktur Direktori

```
app/                       Route Next.js (App Router) — page.tsx & route.ts per endpoint
  api/                      Route Handler (identity, quest/start, quest/complete, leaderboard/full)
  hub/, campaign/[code]/…   Halaman pemain
components/
  quest/                    10 komponen game + registry.tsx (quest_type -> komponen) + quest-runner.tsx
  hub/, campaign/, klasemen/, identity/   Komponen per halaman
  ui/                       Komponen dasar (Button, Card, Modal, Icons, dst) — design system
lib/
  data.ts                   Semua query/mutasi Supabase (satu-satunya tempat akses DB)
  scoring.ts                Fungsi scoring server-side per quest_type
  quest-config-schemas.ts   Skema Zod config_json per quest_type
  bgm-engine.ts, bgm-tracks.ts, music-theory.ts, sound.ts   Sistem audio (§7)
  share-card.ts             Generator kartu hasil (§8)
  session.ts, env.ts        Sesi & environment variable (server-only)
  format.ts, validators.ts, constants.ts, types.ts   Util & tipe bersama
supabase/
  schema.sql, seed.sql      Skema & data awal (idempotent, aman dijalankan ulang)
  scripts/                  Script SQL operasional (lihat docs/petunjuk-teknis.md)
docs/
  deployment.md, quest-config-templates.md, full-documentation.md (dokumen ini), petunjuk-teknis.md
```

## 10. Referensi Dokumen Lain

- `docs/deployment.md` — setup Vercel + Supabase, environment variable, checklist keamanan
- `docs/quest-config-templates.md` — template `config_json` siap-salin untuk 10 tipe quest
- `docs/petunjuk-teknis.md` — panduan operasional harian (kelola campaign, quest, peserta)
- `supabase/scripts/` — script SQL siap pakai untuk semua operasi umum
