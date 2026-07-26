-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Utang Sehat & Kebiasaan Nabung"
-- Mengcover Edisi 5 (Utang Sehat) dan Edisi 6 (Nabung Dulu, Bukan Nunggu
-- Sisa) dari docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md.
--
-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang (upsert lewat
-- ON CONFLICT). Independen dari supabase/seed-atur-anggaran-dana-darurat.sql
-- -- boleh dijalankan dalam urutan apa pun / salah satu saja.
--
-- Kedua edisi punya kedalaman setara (6 "Konsep Penting" masing-masing di
-- dokumen handoff) -- dibagi rata 2 quest per edisi, total 4 quest.
-- Tipe mekanik: quick_reaction & memory_cards (2 tipe yang tersisa, belum
-- pernah dipakai di CR-C01 maupun CR-C03) + tap_select & swipe_cards (boleh
-- dipakai lagi karena berasal dari CR-C01 -- bukan campaign yang LANGSUNG
-- sebelumnya, yang mana itu CR-C03 dengan timeline_sort/match_pairs/
-- scenario_choice/simulation, sama sekali tidak diulang di sini).
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain sama
-- sekali. Aktifkan lewat supabase/scripts/04-update-campaign-status.sql
-- Skenario B kalau sudah siap tayang.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C04',
  'Cageur Rekening Quest — Utang Sehat & Kebiasaan Nabung',
  'Latihan mengenali utang yang sehat dan membangun kebiasaan menabung sejak awal gajian, bukan cuma dari sisa.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 9 — Radar Utang Sehat (quick_reaction) · Edisi 5: Utang Sehat
-- Melatih mengenali "tanda cicilan mulai tidak terkendali" (Edisi 5) di
-- bawah tekanan waktu -- tap tanda bahaya, tahan di kebiasaan yang sudah sehat.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q009',
  'Radar Utang Sehat',
  'Tap cepat tanda bahaya cicilan, tahan di kebiasaan yang sudah sehat',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul tanda bahaya cicilan, tahan saat muncul kebiasaan yang sudah sehat.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Nambah pinjaman buat nutup cicilan lain", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Nggak tahu total semua cicilan aktif", "isTarget": true, "emoji": "❓" },
      { "id": "r3", "label": "Telat bayar lagi bulan ini", "isTarget": true, "emoji": "⏰" },
      { "id": "r4", "label": "Cicilan sesuai kemampuan bayar bulanan", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Selalu bayar tepat waktu", "isTarget": false, "emoji": "🗓️" }
    ],
    "badge": { "code": "radar-utang", "title": "Radar Utang Sehat" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 10 — Cek Utang Cageur (tap_select) · Edisi 5: Utang Sehat
-- Checklist ciri utang sehat vs tidak, sesuai "Konsep Penting" Edisi 5:
-- bunga/tenor dipahami, cicilan sesuai kemampuan, hindari gali lubang
-- tutup lubang.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q010',
  'Cek Utang Cageur',
  'Tap semua kebiasaan utang yang sehat',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua kebiasaan yang menunjukkan utang/cicilan yang sehat.",
    "cards": [
      { "id": "c1", "label": "Tahu jelas bunga & tenor sebelum pinjam", "healthy": true, "emoji": "📄" },
      { "id": "c2", "label": "Cicilan tidak lebih dari kemampuan bayar", "healthy": true, "emoji": "⚖️" },
      { "id": "c3", "label": "Bayar cicilan tepat waktu tiap bulan", "healthy": true, "emoji": "✅" },
      { "id": "c4", "label": "Pinjam cuma buat kebutuhan yang jelas tujuannya", "healthy": true, "emoji": "🎯" },
      { "id": "c5", "label": "Gali lubang tutup lubang, pinjam buat bayar pinjaman lain", "healthy": false, "emoji": "🕳️" },
      { "id": "c6", "label": "Nggak pernah cek total semua utang yang aktif", "healthy": false, "emoji": "🙈" },
      { "id": "c7", "label": "Pinjam buat ikutan gaya hidup orang lain", "healthy": false, "emoji": "🛍️" }
    ],
    "badge": { "code": "utang-cageur", "title": "Utang Cageur" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 11 — Ingat Kebiasaan Nabung (memory_cards) · Edisi 6: Nabung Dulu
-- Menguatkan istilah-istilah kunci dari "Konsep Penting" Edisi 6 lewat
-- permainan memori.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q011',
  'Ingat Kebiasaan Nabung',
  'Buka kartu dan temukan pasangan kebiasaan menabung yang baik',
  'memory_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Buka kartu dan temukan semua pasangan kebiasaan menabung yang baik.",
    "pairs": [
      { "id": "m1", "label": "Bayar Diri Sendiri Dulu", "emoji": "🐷" },
      { "id": "m2", "label": "Transfer Otomatis", "emoji": "🔁" },
      { "id": "m3", "label": "Mulai dari Nominal Kecil", "emoji": "🌱" },
      { "id": "m4", "label": "Tabungan Punya Tujuan", "emoji": "🎯" }
    ],
    "badge": { "code": "ingat-nabung", "title": "Ingat Nabung" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 12 — Gajian Masuk, Prioritas Apa Dulu (swipe_cards) · Edisi 6: Nabung Dulu
-- Mempraktikkan prinsip "bayar diri sendiri lebih dulu" -- tabungan &
-- dana darurat disisihkan SEBELUM pos lain, bukan menunggu sisa.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q012',
  'Gajian Masuk, Prioritas Apa Dulu',
  'Swipe tiap pos ke urutan prioritas yang tepat',
  'swipe_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Gajian baru masuk. Swipe tiap pos ke urutan prioritas yang paling tepat.",
    "directions": { "right": "Segera Sisihkan", "up": "Setelah Kebutuhan", "left": "Belakangan Saja" },
    "items": [
      { "id": "i1", "label": "Tabungan rutin bulanan", "best": "Segera Sisihkan", "emoji": "🐷" },
      { "id": "i2", "label": "Dana darurat", "best": "Segera Sisihkan", "emoji": "🛡️" },
      { "id": "i3", "label": "Kebutuhan pokok sehari-hari", "best": "Setelah Kebutuhan", "emoji": "🧾" },
      { "id": "i4", "label": "Cicilan wajib", "best": "Setelah Kebutuhan", "emoji": "🏦" },
      { "id": "i5", "label": "Belanja hiburan/gaya hidup", "best": "Belakangan Saja", "emoji": "🎮" },
      { "id": "i6", "label": "Barang diskon yang belum benar-benar perlu", "best": "Belakangan Saja", "emoji": "🛒" }
    ],
    "badge": { "code": "prioritas-gajian", "title": "Prioritas Gajian" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C04, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values ('Q009', 10), ('Q010', 20), ('Q011', 30), ('Q012', 40)) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C04'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
