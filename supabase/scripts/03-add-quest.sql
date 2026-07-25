-- =============================================================================
-- INSERT: Tambah quest baru (pilih 1 dari 10 tipe) + hubungkan ke campaign
-- Aman dijalankan ulang (upsert lewat ON CONFLICT quest_code).
--
-- CARA PAKAI:
--   1. Di STEP 1 di bawah ada 10 template config_json, satu per quest_type.
--      Pilih SATU yang sesuai, salin isinya, ganti instruction/cards/dst
--      sesuai konten yang diinginkan. Semua field "id" di dalam array wajib
--      unik dalam satu quest (dipakai untuk mencocokkan jawaban).
--   2. Tempelkan hasilnya ke config_json di STEP 2 (baris bertanda 👉),
--      lalu isi quest_code/title/subtitle/quest_type/max_score.
--   3. STEP 3 (opsional) menghubungkan quest ini ke sebuah campaign. Hapus
--      / abaikan STEP 3 kalau quest ini mau dibuat dulu tanpa langsung
--      dipasang ke campaign manapun.
--
-- Referensi lengkap tiap tipe & skema validasi Zod-nya ada di
-- docs/quest-config-templates.md dan lib/quest-config-schemas.ts. Kalau
-- config_json tidak sesuai skema, quest otomatis disembunyikan dari pemain
-- (tidak bikin aplikasi crash) -- jadi selalu tes dulu setelah insert.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1 -- template config_json per quest_type (semua dikomentari; salin 1)
-- ---------------------------------------------------------------------------

-- 👉 tap_select -- pemain tap semua kartu yang termasuk kondisi "sehat"
-- {
--   "instruction": "Tap semua kebiasaan yang bikin rekening makin sehat.",
--   "cards": [
--     { "id": "c1", "label": "Punya dana darurat", "healthy": true, "emoji": "🛡️" },
--     { "id": "c2", "label": "Sering belanja impulsif", "healthy": false, "emoji": "🛍️" }
--   ],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 hidden_object -- cari semua "targets" dalam batas waktu, hindari "decoys"
-- {
--   "instruction": "Dalam 30 detik, tap pengeluaran kecil yang bisa jadi bocor halus.",
--   "timeLimitSeconds": 30,
--   "targets": [{ "id": "t1", "label": "Kopi harian", "emoji": "☕" }],
--   "decoys": [{ "id": "d1", "label": "Dana darurat", "emoji": "🛡️" }],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 budget_slider -- bagi totalCoins ke beberapa categories (zona ideal/waspada)
-- {
--   "instruction": "Kamu punya 100 koin gaji. Bagi ke pos yang tepat.",
--   "totalCoins": 100,
--   "categories": [
--     { "id": "kebutuhan", "label": "Kebutuhan utama", "emoji": "🧾", "idealMin": 40, "idealMax": 60, "warningMin": 30, "warningMax": 70 }
--   ],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 swipe_cards -- arahkan tiap item ke salah satu directions (right/up/left)
-- {
--   "instruction": "Swipe setiap barang ke keputusan yang paling bijak.",
--   "directions": { "right": "Checkout", "up": "Tunda 24 Jam", "left": "Keluarkan" },
--   "items": [{ "id": "i1", "label": "Obat", "best": "Checkout", "emoji": "💊" }],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 match_pairs -- jodohkan item kolom kiri dengan pasangannya di kanan
-- {
--   "instruction": "Jodohkan istilah dengan artinya.",
--   "pairs": [{ "id": "p1", "left": "Dana darurat", "right": "Simpanan untuk kondisi tak terduga", "emoji": "🛡️" }],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 timeline_sort -- urutkan items sesuai "order" yang benar (1 = paling awal)
-- {
--   "instruction": "Urutkan langkah menyusun budget bulanan.",
--   "items": [
--     { "id": "s1", "label": "Catat penghasilan", "order": 1, "emoji": "📝" },
--     { "id": "s2", "label": "Sisihkan tabungan", "order": 2, "emoji": "🐷" }
--   ],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 scenario_choice -- rangkaian skenario pilihan ganda, tiap opsi punya "correct"
-- {
--   "instruction": "Pilih respons paling bijak untuk tiap situasi.",
--   "scenarios": [
--     {
--       "id": "sc1",
--       "prompt": "Gajian baru masuk, ada notifikasi flash sale. Apa yang kamu lakukan?",
--       "options": [
--         { "id": "o1", "label": "Cek budget dulu sebelum checkout", "correct": true, "feedback": "Betul, cek budget dulu." },
--         { "id": "o2", "label": "Checkout langsung", "correct": false, "feedback": "Hati-hati, ini bisa jadi bocor halus." }
--       ]
--     }
--   ],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 memory_cards -- kartu memori klasik, tiap pairs jadi 2 kartu berlabel sama
-- {
--   "instruction": "Buka kartu dan temukan semua pasangannya.",
--   "pairs": [{ "id": "m1", "label": "Kebutuhan", "emoji": "🧾" }],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 quick_reaction -- ronde isTarget:true harus ditap dalam reactionWindowMs
-- {
--   "instruction": "Tap secepatnya saat muncul kesempatan menabung, tahan saat godaan belanja muncul.",
--   "reactionWindowMs": 1200,
--   "rounds": [{ "id": "r1", "label": "Ada rezeki lebih!", "isTarget": true, "emoji": "💰" }],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- 👉 simulation -- keputusan bertahap, tiap step punya opsi berbobot "impact" (0-1)
-- {
--   "instruction": "Ambil keputusan finansial di tiap tahap simulasi.",
--   "steps": [
--     {
--       "id": "st1",
--       "label": "Bonus tahunan cair. Apa langkah pertamamu?",
--       "options": [
--         { "id": "op1", "label": "Sisihkan sebagian ke dana darurat", "impact": 1 },
--         { "id": "op2", "label": "Habiskan untuk liburan mendadak", "impact": 0.2 }
--       ]
--     }
--   ],
--   "badge": { "code": "kode-badge", "title": "Judul Badge" }
-- }

-- ---------------------------------------------------------------------------
-- STEP 2 -- insert utama (contoh di bawah pakai template tap_select apa adanya;
-- GANTI config_json dengan template pilihanmu dari STEP 1)
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q005',                                     -- 👉 kode unik quest
  'Judul Quest Baru',                         -- 👉 judul
  'Subjudul singkat',                         -- 👉 subtitle (boleh null)
  'tap_select',                               -- 👉 samakan dengan tipe template yang dipakai (10 pilihan di STEP 1)
  'active',                                   -- 👉 status: draft|upcoming|active|archived|disabled
  25,                                         -- 👉 skor maksimal
  1,                                          -- version -- naikkan manual kalau suatu saat rombak total config quest ini
  false,                                      -- allow_replay -- true kalau peserta boleh main ulang quest ini
  '{
    "instruction": "Tap semua kebiasaan yang bikin rekening makin sehat.",
    "cards": [
      { "id": "c1", "label": "Punya dana darurat", "healthy": true, "emoji": "🛡️" },
      { "id": "c2", "label": "Sering belanja impulsif", "healthy": false, "emoji": "🛍️" }
    ],
    "badge": { "code": "kode-badge-baru", "title": "Judul Badge Baru" }
  }'::jsonb                                    -- 👉 GANTI dengan template STEP 1 yang sudah kamu sesuaikan
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json
returning *;

-- ---------------------------------------------------------------------------
-- STEP 3 (OPSIONAL) -- hubungkan quest ini ke sebuah campaign
-- ---------------------------------------------------------------------------
-- unlock_rule:
--   'independent'  -> bebas urutan, semua langsung terbuka
--   'sequential'   -> harus urut sesuai order_index (dipakai di seed.sql)
--   'prerequisite' -> baru terbuka kalau quest lain (isi prerequisite_quest_ids) selesai
--   'scheduled'    -> baru terbuka mulai available_from
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id,
  5,             -- 👉 order_index (urutan tampil -- quest terakhir campaign ini + 1)
  true,          -- 👉 is_required
  'sequential'   -- 👉 unlock_rule (lihat penjelasan di atas)
from campaigns c, quests q
where c.campaign_code = 'CR-C01'   -- 👉 kode campaign tujuan
  and q.quest_code = 'Q005'        -- 👉 samakan dengan quest_code di STEP 2
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule
returning *;
