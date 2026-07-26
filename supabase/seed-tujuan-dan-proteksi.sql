-- =============================================================================
-- Cageur Rekening Quest — seed quest untuk campaign "Tujuan dan Proteksi"
-- (CR-C02, sudah ada di supabase/seed.sql sebagai placeholder status
-- 'upcoming' tanpa quest). Mengcover Edisi 9 (Financial Goal) dan Edisi 14
-- (Proteksi Keuangan) dari docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md
-- -- judul campaign "Tujuan dan Proteksi" cocok persis dengan kedua edisi ini.
--
-- Jalankan setelah supabase/schema.sql DAN supabase/seed.sql (campaign
-- CR-C02 harus sudah ada lebih dulu). Aman dijalankan ulang (upsert lewat
-- ON CONFLICT). Tidak menyentuh baris campaigns CR-C02 sama sekali --
-- statusnya tetap 'upcoming' sampai diaktifkan lewat
-- supabase/scripts/04-update-campaign-status.sql Skenario B saat mau dites.
--
-- Sengaja dibuat 5 quest per edisi (10 total, lebih banyak dari campaign
-- sebelumnya) supaya SEMUA 10 tipe mekanik quest yang ada di
-- components/quest/registry.tsx terpakai masing-masing tepat sekali di
-- sini -- campaign ini jadi "tur lengkap" semua mekanik buat dicoba.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Quest 13 — Ciri Tujuan Keuangan Cageur (tap_select) · Edisi 9: Financial Goal
-- "Tentukan apa yang ingin dicapai" -- kenali ciri tujuan yang spesifik &
-- terukur vs yang masih terlalu umum/samar.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q013',
  'Ciri Tujuan Keuangan Cageur',
  'Tap semua ciri tujuan keuangan yang jelas dan terukur',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua ciri tujuan keuangan yang sudah jelas dan terukur.",
    "cards": [
      { "id": "c1", "label": "Ada nominal target yang jelas", "healthy": true, "emoji": "🎯" },
      { "id": "c2", "label": "Ada batas waktu pencapaian", "healthy": true, "emoji": "📅" },
      { "id": "c3", "label": "Realistis sesuai penghasilan", "healthy": true, "emoji": "⚖️" },
      { "id": "c4", "label": "Sudah kepikiran cara mencapainya", "healthy": true, "emoji": "🗺️" },
      { "id": "c5", "label": "Cuma \"pengen kaya\" tanpa target jelas", "healthy": false, "emoji": "💭" },
      { "id": "c6", "label": "Ikut-ikutan tujuan orang lain", "healthy": false, "emoji": "👥" },
      { "id": "c7", "label": "Tidak pernah dievaluasi ulang", "healthy": false, "emoji": "🙈" }
    ],
    "badge": { "code": "tujuan-cageur", "title": "Tujuan Cageur" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 14 — Langkah Menetapkan Tujuan (timeline_sort) · Edisi 9: Financial Goal
-- Urutan sesuai "Konsep Penting": tentukan apa yang dicapai -> kapan ->
-- hitung kebutuhan dana -> hitung kontribusi rutin.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q014',
  'Langkah Menetapkan Tujuan',
  'Urutkan langkah menyusun tujuan keuangan dari awal',
  'timeline_sort',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Urutkan langkah menetapkan tujuan keuangan dari yang paling awal.",
    "items": [
      { "id": "t1", "label": "Tentukan apa yang ingin dicapai", "order": 1, "emoji": "🎯" },
      { "id": "t2", "label": "Tentukan kapan target ingin dicapai", "order": 2, "emoji": "📅" },
      { "id": "t3", "label": "Hitung total kebutuhan dananya", "order": 3, "emoji": "🧮" },
      { "id": "t4", "label": "Hitung kontribusi rutin yang dibutuhkan", "order": 4, "emoji": "💰" }
    ],
    "badge": { "code": "runut-tujuan", "title": "Runut Tujuan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 15 — Jodoh Tujuan & Jangka Waktu (match_pairs) · Edisi 9: Financial Goal
-- "Bedakan tujuan jangka pendek, menengah, dan panjang."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q015',
  'Jodoh Tujuan & Jangka Waktu',
  'Cocokkan tujuan keuangan dengan kategori jangka waktunya',
  'match_pairs',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Jodohkan tujuan keuangan dengan kategori jangka waktunya.",
    "pairs": [
      { "id": "p1", "left": "Servis motor 3 bulan lagi", "right": "Jangka Pendek (kurang dari 1 tahun)", "emoji": "🏍️" },
      { "id": "p2", "left": "Liburan keluarga tahun depan", "right": "Jangka Menengah (1-5 tahun)", "emoji": "✈️" },
      { "id": "p3", "left": "Uang muka rumah 5 tahun lagi", "right": "Jangka Panjang (lebih dari 5 tahun)", "emoji": "🏠" },
      { "id": "p4", "left": "Dana pensiun", "right": "Jangka Sangat Panjang (puluhan tahun)", "emoji": "🌅" }
    ],
    "badge": { "code": "jodoh-tujuan", "title": "Paham Jangka Waktu Tujuan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 16 — Alokasi Menuju Tujuan (budget_slider) · Edisi 9: Financial Goal
-- "Hitung kontribusi rutin yang dibutuhkan" -- sisihkan porsi budget yang
-- pas buat kontribusi tujuan di tengah pos-pos lain.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q016',
  'Alokasi Menuju Tujuan',
  'Bagi 100 koin gaji, sisihkan porsi yang pas buat tujuanmu',
  'budget_slider',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Kamu punya 100 koin gaji. Bagi ke pos yang tepat supaya tujuan keuanganmu tetap jalan.",
    "totalCoins": 100,
    "categories": [
      { "id": "kebutuhan", "label": "Kebutuhan pokok", "emoji": "🧾", "idealMin": 40, "idealMax": 60, "warningMin": 30, "warningMax": 70 },
      { "id": "cicilan", "label": "Cicilan wajib", "emoji": "🏦", "idealMin": 0, "idealMax": 25, "warningMin": 0, "warningMax": 35 },
      { "id": "kontribusi-tujuan", "label": "Kontribusi rutin ke tujuan", "emoji": "🎯", "idealMin": 15, "idealMax": 30, "warningMin": 10, "warningMax": 40 },
      { "id": "hiburan", "label": "Hiburan/gaya hidup", "emoji": "🎮", "idealMin": 5, "idealMax": 20, "warningMin": 0, "warningMax": 30 }
    ],
    "badge": { "code": "kontribusi-cageur", "title": "Kontribusi Cageur" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 17 — Tujuan Mana Didahulukan (scenario_choice) · Edisi 9: Financial Goal
-- "Fokus pada tujuan yang paling prioritas" + "tujuan dapat disesuaikan
-- jika kondisi berubah."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q017',
  'Tujuan Mana Didahulukan',
  'Pilih respons paling tepat saat dana terbatas',
  'scenario_choice',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Pilih respons paling tepat untuk tiap situasi dana terbatas.",
    "scenarios": [
      {
        "id": "sc1",
        "prompt": "Kamu punya 2 tujuan: dana darurat belum penuh, dan pengen upgrade motor. Uang cuma cukup buat salah satu.",
        "options": [
          { "id": "o1", "label": "Selesaikan dulu dana darurat, motor bisa nunggu", "correct": true, "feedback": "Betul, tujuan yang jadi lapisan pengaman diutamakan dulu." },
          { "id": "o2", "label": "Upgrade motor dulu, dana darurat nanti saja", "correct": false, "feedback": "Dana darurat itu fondasi -- lebih aman diselesaikan lebih dulu." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Penghasilanmu naik cukup besar bulan ini. Apa yang sebaiknya dilakukan ke tujuan yang sudah disusun?",
        "options": [
          { "id": "o1", "label": "Evaluasi ulang dan sesuaikan target/kontribusinya", "correct": true, "feedback": "Betul, tujuan boleh disesuaikan kalau kondisi berubah." },
          { "id": "o2", "label": "Biarkan saja, tujuan yang sudah dibuat tidak boleh diubah", "correct": false, "feedback": "Tujuan itu fleksibel -- boleh disesuaikan kalau kondisinya berubah." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Kamu punya banyak keinginan tapi dana bulan ini terbatas.",
        "options": [
          { "id": "o1", "label": "Fokus ke satu tujuan yang paling prioritas dulu", "correct": true, "feedback": "Tepat, fokus ke prioritas bikin tujuan lebih cepat tercapai." },
          { "id": "o2", "label": "Coba cicil semua tujuan sedikit-sedikit sekaligus", "correct": false, "feedback": "Kalau dana terbatas, fokus ke satu tujuan prioritas biasanya lebih efektif." }
        ]
      }
    ],
    "badge": { "code": "fokus-tujuan", "title": "Fokus Tujuan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 18 — Cari Lapisan Proteksi (hidden_object) · Edisi 14: Proteksi Keuangan
-- "Dana darurat, asuransi kesehatan, asuransi jiwa, dokumen keuangan
-- keluarga" -- semua lapisan proteksi dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q018',
  'Cari Lapisan Proteksi',
  'Temukan semua lapisan proteksi keuangan dalam waktu terbatas',
  'hidden_object',
  'active',
  25,
  1,
  false,
  '{
    "instruction": "Dalam 30 detik, tap semua hal yang termasuk lapisan proteksi keuangan.",
    "timeLimitSeconds": 30,
    "targets": [
      { "id": "t1", "label": "Dana darurat", "emoji": "🛡️" },
      { "id": "t2", "label": "Asuransi kesehatan", "emoji": "🏥" },
      { "id": "t3", "label": "Asuransi jiwa", "emoji": "❤️" },
      { "id": "t4", "label": "Dokumen keuangan keluarga yang rapi", "emoji": "📁" },
      { "id": "t5", "label": "Ahli waris yang jelas", "emoji": "📝" }
    ],
    "decoys": [
      { "id": "d1", "label": "Saham gorengan", "emoji": "📉" },
      { "id": "d2", "label": "Kartu kredit tanpa batas", "emoji": "💳" },
      { "id": "d3", "label": "Investasi tanpa izin OJK", "emoji": "🚫" },
      { "id": "d4", "label": "Belanja impulsif", "emoji": "🛍️" },
      { "id": "d5", "label": "Utang gali lubang tutup lubang", "emoji": "🕳️" }
    ],
    "badge": { "code": "penjaga-proteksi", "title": "Penjaga Proteksi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 19 — Radar Risiko Belum Terlindungi (quick_reaction) · Edisi 14: Proteksi Keuangan
-- "Mengidentifikasi risiko yang belum terlindungi."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q019',
  'Radar Risiko Belum Terlindungi',
  'Tap cepat risiko yang belum terlindungi, tahan yang sudah aman',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul risiko yang belum terlindungi, tahan saat muncul kondisi yang sudah aman.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Belum punya asuransi kesehatan sama sekali", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Satu-satunya pencari nafkah tanpa asuransi jiwa", "isTarget": true, "emoji": "❗" },
      { "id": "r3", "label": "Dokumen keuangan keluarga berantakan", "isTarget": true, "emoji": "📂" },
      { "id": "r4", "label": "Sudah punya dana darurat dan asuransi kesehatan", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Ahli waris sudah tercatat jelas", "isTarget": false, "emoji": "📝" }
    ],
    "badge": { "code": "radar-proteksi", "title": "Radar Proteksi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 20 — Pilih Proteksi Sesuai Kondisi (swipe_cards) · Edisi 14: Proteksi Keuangan
-- "Memilih jenis proteksi berdasarkan kondisi keluarga."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q020',
  'Pilih Proteksi Sesuai Kondisi',
  'Swipe tiap kondisi ke tingkat urgensi proteksinya',
  'swipe_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Swipe tiap kondisi keluarga ke tingkat urgensi proteksi yang paling tepat.",
    "directions": { "right": "Prioritas Utama", "up": "Pertimbangkan", "left": "Belum Mendesak" },
    "items": [
      { "id": "i1", "label": "Jadi tulang punggung keluarga, belum ada asuransi jiwa", "best": "Prioritas Utama", "emoji": "👨‍👩‍👧" },
      { "id": "i2", "label": "Belum punya dana darurat sama sekali", "best": "Prioritas Utama", "emoji": "🛡️" },
      { "id": "i3", "label": "Sudah punya asuransi kesehatan dasar dari kantor", "best": "Pertimbangkan", "emoji": "🏥" },
      { "id": "i4", "label": "Masih lajang, belum ada tanggungan", "best": "Belum Mendesak", "emoji": "🧍" },
      { "id": "i5", "label": "Dokumen keuangan keluarga belum rapi", "best": "Pertimbangkan", "emoji": "📁" },
      { "id": "i6", "label": "Sudah punya proteksi lengkap sesuai kebutuhan", "best": "Belum Mendesak", "emoji": "✅" }
    ],
    "badge": { "code": "sigap-proteksi", "title": "Sigap Proteksi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 21 — Ingat Istilah Proteksi (memory_cards) · Edisi 14: Proteksi Keuangan
-- "Pahami manfaat dan pengecualian produk perlindungan" -- kenalan sama
-- istilah kuncinya lebih dulu.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q021',
  'Ingat Istilah Proteksi',
  'Buka kartu dan temukan pasangan istilah proteksi keuangan',
  'memory_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Buka kartu dan temukan semua pasangan istilah proteksi keuangan.",
    "pairs": [
      { "id": "m1", "label": "Premi", "emoji": "💵" },
      { "id": "m2", "label": "Polis", "emoji": "📜" },
      { "id": "m3", "label": "Manfaat", "emoji": "🎁" },
      { "id": "m4", "label": "Pengecualian", "emoji": "⚠️" }
    ],
    "badge": { "code": "ingat-proteksi", "title": "Ingat Proteksi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 22 — Simulasi Siapkan Proteksi Keluarga (simulation) · Edisi 14: Proteksi Keuangan
-- "Proteksi disesuaikan kebutuhan & kemampuan" + "pahami manfaat dan
-- pengecualian sebelum membeli produk."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q022',
  'Simulasi Siapkan Proteksi Keluarga',
  'Ambil keputusan tahap demi tahap menyiapkan proteksi keluarga',
  'simulation',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Ambil keputusan tiap tahap untuk menyiapkan proteksi keuangan keluarga.",
    "steps": [
      {
        "id": "st1",
        "label": "Kamu baru sadar belum punya proteksi apa pun. Apa langkah pertamamu?",
        "options": [
          { "id": "op1", "label": "Cek dulu risiko apa yang paling mendesak buat keluargamu", "impact": 1 },
          { "id": "op2", "label": "Beli asuransi apa saja yang ditawarkan agen", "impact": 0.2 }
        ]
      },
      {
        "id": "st2",
        "label": "Setelah tahu kebutuhannya, budget proteksi terbatas. Apa yang kamu lakukan?",
        "options": [
          { "id": "op1", "label": "Pilih proteksi sesuai kebutuhan & kemampuan, bukan yang paling mahal", "impact": 1 },
          { "id": "op2", "label": "Pilih produk paling mahal supaya manfaatnya paling banyak", "impact": 0.3 }
        ]
      },
      {
        "id": "st3",
        "label": "Sebelum tanda tangan polis, apa yang kamu lakukan?",
        "options": [
          { "id": "op1", "label": "Baca manfaat dan pengecualian produknya dengan teliti", "impact": 1 },
          { "id": "op2", "label": "Langsung tanda tangan tanpa baca detail", "impact": 0.1 }
        ]
      }
    ],
    "badge": { "code": "siap-proteksi", "title": "Siap Proteksi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C02, urut sequential
-- (order_index diberi celah 10 supaya gampang menyisipkan quest baru nanti)
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q013', 10), ('Q014', 20), ('Q015', 30), ('Q016', 40), ('Q017', 50),
  ('Q018', 60), ('Q019', 70), ('Q020', 80), ('Q021', 90), ('Q022', 100)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C02'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
