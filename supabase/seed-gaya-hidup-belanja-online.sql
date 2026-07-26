-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Gaya Hidup & Belanja Online Bijak"
-- Mengcover Edisi 11 (Lifestyle Creep) dan Edisi 12 (Belanja Online Bijak)
-- dari docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md.
--
-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang (upsert
-- lewat ON CONFLICT).
--
-- Kedua edisi punya kedalaman setara (6-7 "Konsep Penting" masing-masing)
-- -- dibagi rata 3 quest per edisi, total 6 quest. Tipe mekanik dipilih
-- beda-beda dalam satu campaign ini: hidden_object, budget_slider,
-- scenario_choice (Edisi 11) + tap_select, memory_cards, quick_reaction
-- (Edisi 12).
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain
-- sama sekali. Aktifkan lewat supabase/scripts/04-update-campaign-status.sql
-- Skenario B kalau sudah siap tayang.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C07',
  'Cageur Rekening Quest — Gaya Hidup & Belanja Online Bijak',
  'Latihan mewaspadai kenaikan gaya hidup yang mengikuti kenaikan penghasilan, sekaligus mengelola keputusan belanja online agar tidak impulsif.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 31 — Cari Tanda Lifestyle Creep (hidden_object) · Edisi 11: Lifestyle Creep
-- "Lifestyle creep sering terjadi tanpa disadari" + "pengeluaran kecil
-- dapat meningkat menjadi kebiasaan baru."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q031',
  'Cari Tanda Lifestyle Creep',
  'Temukan semua tanda lifestyle creep dalam waktu terbatas',
  'hidden_object',
  'active',
  25,
  1,
  false,
  '{
    "instruction": "Dalam 30 detik, tap semua tanda lifestyle creep (kenaikan gaya hidup yang tidak disadari).",
    "timeLimitSeconds": 30,
    "targets": [
      { "id": "t1", "label": "Otomatis upgrade gaya hidup tiap gaji naik", "emoji": "📈" },
      { "id": "t2", "label": "Langganan aplikasi menumpuk tanpa pernah dicek", "emoji": "📱" },
      { "id": "t3", "label": "Standar belanja naik terus tanpa disadari", "emoji": "🛍️" },
      { "id": "t4", "label": "Tabungan tidak ikut naik walau gaji naik", "emoji": "🐷" }
    ],
    "decoys": [
      { "id": "d1", "label": "Sebagian kenaikan gaji ditabung/investasi", "emoji": "💰" },
      { "id": "d2", "label": "Langganan dicek ulang tiap beberapa bulan", "emoji": "✅" },
      { "id": "d3", "label": "Menikmati hasil kerja sesuai rencana", "emoji": "🎉" },
      { "id": "d4", "label": "Kebutuhan pokok tetap terpenuhi", "emoji": "🧾" }
    ],
    "badge": { "code": "sadar-lifestyle", "title": "Sadar Lifestyle Creep" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 32 — Bagi Kenaikan Gaji (budget_slider) · Edisi 11: Lifestyle Creep
-- "Tambahan penghasilan dapat dibagi antara dinikmati dan disimpan."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q032',
  'Bagi Kenaikan Gaji',
  'Bagi 100 koin kenaikan gaji ke pos yang seimbang',
  'budget_slider',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Gajimu baru naik. Bagi 100 koin kenaikan ini ke pos yang seimbang.",
    "totalCoins": 100,
    "categories": [
      { "id": "nikmati", "label": "Nikmati sekarang", "emoji": "🎉", "idealMin": 20, "idealMax": 40, "warningMin": 10, "warningMax": 50 },
      { "id": "tabungan", "label": "Tabungan/Investasi", "emoji": "🐷", "idealMin": 30, "idealMax": 50, "warningMin": 20, "warningMax": 60 },
      { "id": "kebutuhan", "label": "Kebutuhan pokok yang ikut naik", "emoji": "🧾", "idealMin": 10, "idealMax": 30, "warningMin": 0, "warningMax": 40 }
    ],
    "badge": { "code": "bagi-kenaikan-gaji", "title": "Bagi Kenaikan Gaji" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 33 — Gaji Naik, Apa yang Berubah? (scenario_choice) · Edisi 11: Lifestyle Creep
-- "Evaluasi langganan, kebiasaan, dan standar konsumsi yang meningkat" +
-- "menikmati hasil kerja tetap diperbolehkan selama terencana."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q033',
  'Gaji Naik, Apa yang Berubah?',
  'Pilih respons paling tepat saat penghasilan naik',
  'scenario_choice',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Pilih respons paling tepat untuk tiap situasi.",
    "scenarios": [
      {
        "id": "sc1",
        "prompt": "Gajimu baru saja naik cukup besar bulan ini.",
        "options": [
          { "id": "o1", "label": "Sisihkan sebagian buat tabungan/investasi sebelum menambah gaya hidup", "correct": true, "feedback": "Betul, tambahan penghasilan sebaiknya dibagi antara dinikmati dan disimpan." },
          { "id": "o2", "label": "Langsung upgrade semua gaya hidup sesuai kenaikan gaji", "correct": false, "feedback": "Kenaikan gaji tidak harus seluruhnya jadi kenaikan konsumsi." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Kamu sadar sudah berlangganan banyak aplikasi yang jarang dipakai.",
        "options": [
          { "id": "o1", "label": "Evaluasi dan berhenti langganan yang tidak perlu", "correct": true, "feedback": "Tepat, evaluasi langganan itu salah satu cara mencegah lifestyle creep." },
          { "id": "o2", "label": "Biarkan saja, nominalnya kecil-kecil", "correct": false, "feedback": "Pengeluaran kecil yang dibiarkan bisa menumpuk jadi kebiasaan baru yang tidak disadari." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Teman sekantor semua upgrade gaya hidup setelah naik jabatan.",
        "options": [
          { "id": "o1", "label": "Tetap sesuaikan dengan rencana keuanganmu sendiri", "correct": true, "feedback": "Betul, menikmati hasil kerja tetap boleh selama terencana, bukan ikut-ikutan." },
          { "id": "o2", "label": "Ikut upgrade semua biar tidak ketinggalan", "correct": false, "feedback": "Ikut-ikutan gaya hidup orang lain bisa menggerus tabungan tanpa disadari." }
        ]
      }
    ],
    "badge": { "code": "sadar-gaya-hidup", "title": "Sadar Gaya Hidup" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 34 — Ciri Belanja Online yang Bijak (tap_select) · Edisi 12: Belanja Online Bijak
-- "Periksa apakah benar-benar dibutuhkan" + "tunda 24 jam jika masih
-- ragu" + "periksa reputasi penjual."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q034',
  'Ciri Belanja Online yang Bijak',
  'Tap semua ciri keputusan belanja online yang bijak',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua ciri keputusan belanja online yang bijak.",
    "cards": [
      { "id": "c1", "label": "Dicek dulu apakah benar-benar butuh", "healthy": true, "emoji": "🔍" },
      { "id": "c2", "label": "Sesuai anggaran yang sudah disiapkan", "healthy": true, "emoji": "💰" },
      { "id": "c3", "label": "Ditunda 24 jam kalau masih ragu", "healthy": true, "emoji": "⏳" },
      { "id": "c4", "label": "Dicek reputasi penjual sebelum checkout", "healthy": true, "emoji": "⭐" },
      { "id": "c5", "label": "Checkout karena lapar mata pas buka aplikasi", "healthy": false, "emoji": "👀" },
      { "id": "c6", "label": "Ikut flash sale tanpa mikir butuh atau tidak", "healthy": false, "emoji": "⚡" },
      { "id": "c7", "label": "Tidak cek keamanan transaksi/reputasi toko", "healthy": false, "emoji": "🚩" }
    ],
    "badge": { "code": "bijak-online", "title": "Bijak Belanja Online" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 35 — Ingat Kebiasaan Belanja Online Sehat (memory_cards) · Edisi 12: Belanja Online Bijak
-- "Gunakan wishlist atau keranjang sebagai ruang pertimbangan" -- kenalan
-- sama istilah kuncinya lebih dulu.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q035',
  'Ingat Kebiasaan Belanja Online Sehat',
  'Buka kartu dan temukan pasangan kebiasaan belanja online sehat',
  'memory_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Buka kartu dan temukan semua pasangan kebiasaan belanja online yang sehat.",
    "pairs": [
      { "id": "m1", "label": "Tunda 24 Jam", "emoji": "⏳" },
      { "id": "m2", "label": "Cek Reputasi Penjual", "emoji": "⭐" },
      { "id": "m3", "label": "Wishlist Dulu", "emoji": "📝" },
      { "id": "m4", "label": "Sesuai Anggaran", "emoji": "💰" }
    ],
    "badge": { "code": "ingat-belanja-online", "title": "Ingat Belanja Online" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 36 — Radar Jebakan Belanja Online (quick_reaction) · Edisi 12: Belanja Online Bijak
-- "Hindari checkout karena lapar mata" -- kenali jebakan flash sale/promo
-- di bawah tekanan waktu.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q036',
  'Radar Jebakan Belanja Online',
  'Tap cepat tanda jebakan belanja online, tahan yang aman',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul tanda jebakan belanja online, tahan saat muncul kondisi yang aman.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Flash sale mendesak \"cuma 5 menit lagi\"", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Harga coret-coret yang tidak jelas aslinya", "isTarget": true, "emoji": "🏷️" },
      { "id": "r3", "label": "Review yang keliatan seragam/palsu", "isTarget": true, "emoji": "⚠️" },
      { "id": "r4", "label": "Promo resmi dari toko terverifikasi", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Barang di wishlist yang sudah dipikirkan matang", "isTarget": false, "emoji": "📝" }
    ],
    "badge": { "code": "radar-jebakan-online", "title": "Radar Jebakan Online" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C07, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q031', 10), ('Q032', 20), ('Q033', 30), ('Q034', 40), ('Q035', 50), ('Q036', 60)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C07'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
