-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Paylater Bijak & Proteksi Keuangan"
-- Mengcover Edisi 13 (Paylater dan Kartu Kredit) dan Edisi 14 (Proteksi
-- Keuangan) dari docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md.
--
-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang (upsert
-- lewat ON CONFLICT).
--
-- Kedua edisi punya kedalaman setara (7 "Konsep Penting" masing-masing) --
-- dibagi rata 3 quest per edisi, total 6 quest. Tipe mekanik dipilih
-- beda-beda dalam satu campaign ini: tap_select, scenario_choice,
-- swipe_cards (Edisi 13) + hidden_object, quick_reaction, simulation
-- (Edisi 14).
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain
-- sama sekali. Aktifkan lewat supabase/scripts/04-update-campaign-status.sql
-- Skenario B kalau sudah siap tayang.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C08',
  'Cageur Rekening Quest — Paylater Bijak & Proteksi Keuangan',
  'Latihan menggunakan paylater dan kartu kredit secara bijak, sekaligus menyiapkan proteksi keuangan yang sesuai kebutuhan keluarga.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 37 — Ciri Pakai Paylater/Kartu Kredit yang Bijak (tap_select) · Edisi 13: Paylater dan Kartu Kredit
-- "Bayar tepat waktu" + "pelunasan penuh lebih aman daripada bayar
-- minimum" + "gunakan hanya jika sesuai kemampuan bayar."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q037',
  'Ciri Pakai Paylater/Kartu Kredit yang Bijak',
  'Tap semua ciri pemakaian paylater/kartu kredit yang bijak',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua ciri pemakaian paylater/kartu kredit yang bijak.",
    "cards": [
      { "id": "c1", "label": "Dibayar penuh tepat waktu tiap bulan", "healthy": true, "emoji": "✅" },
      { "id": "c2", "label": "Dipakai sesuai kemampuan bayar", "healthy": true, "emoji": "⚖️" },
      { "id": "c3", "label": "Paham bunga, biaya, dan tanggal jatuh tempo", "healthy": true, "emoji": "📄" },
      { "id": "c4", "label": "Dicek dulu dampaknya ke cash flow bulan depan", "healthy": true, "emoji": "📊" },
      { "id": "c5", "label": "Numpuk tagihan kecil di banyak platform", "healthy": false, "emoji": "🕳️" },
      { "id": "c6", "label": "Cuma bayar minimum terus tiap bulan", "healthy": false, "emoji": "⚠️" },
      { "id": "c7", "label": "Dipakai buat belanja impulsif", "healthy": false, "emoji": "🛍️" }
    ],
    "badge": { "code": "bijak-paylater", "title": "Bijak Paylater" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 38 — Tagihan Menumpuk, Apa yang Dilakukan? (scenario_choice) · Edisi 13: Paylater dan Kartu Kredit
-- "Menentukan tindakan ketika tagihan menumpuk" + "mengidentifikasi
-- risiko pembayaran minimum."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q038',
  'Tagihan Menumpuk, Apa yang Dilakukan?',
  'Pilih respons paling tepat saat tagihan mulai menumpuk',
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
        "prompt": "Tagihan paylater dan kartu kreditmu mulai menumpuk di beberapa platform.",
        "options": [
          { "id": "o1", "label": "Data semua tagihan, lunasi yang bunganya paling besar dulu", "correct": true, "feedback": "Betul, memetakan semua tagihan dulu membantu memutuskan prioritas pelunasan." },
          { "id": "o2", "label": "Abaikan dulu, bayar minimum saja tiap bulan", "correct": false, "feedback": "Bayar minimum terus-menerus justru membuat bunga menumpuk lebih besar." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Kamu cuma sanggup bayar minimum bulan ini.",
        "options": [
          { "id": "o1", "label": "Bayar minimum dulu, tapi rencanakan pelunasan penuh secepatnya", "correct": true, "feedback": "Tepat, pelunasan penuh umumnya lebih aman daripada terus-menerus bayar minimum." },
          { "id": "o2", "label": "Anggap aman karena sudah bayar minimum tepat waktu", "correct": false, "feedback": "Bayar minimum terus tetap menumpuk bunga -- bukan solusi jangka panjang." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Ada promo paylater buat barang yang sebenarnya belum kamu butuhkan.",
        "options": [
          { "id": "o1", "label": "Lewati promonya, paylater bukan buat belanja impulsif", "correct": true, "feedback": "Betul, paylater dan kartu kredit adalah alat pembayaran, bukan alasan buat belanja impulsif." },
          { "id": "o2", "label": "Pakai saja, kan bisa dicicil", "correct": false, "feedback": "Kemudahan cicilan bukan alasan buat membeli yang belum benar-benar dibutuhkan." }
        ]
      }
    ],
    "badge": { "code": "sigap-paylater", "title": "Sigap Paylater" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 39 — Transaksi Mana yang Layak Pakai Kartu Kredit? (swipe_cards) · Edisi 13: Paylater dan Kartu Kredit
-- "Memilih transaksi yang layak menggunakan kartu kredit/paylater" --
-- contoh pengembangan kuis persis dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q039',
  'Transaksi Mana yang Layak Pakai Kartu Kredit?',
  'Swipe tiap transaksi ke kategori yang paling tepat',
  'swipe_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Swipe tiap transaksi ke kategori yang paling tepat.",
    "directions": { "right": "Layak Kredit", "up": "Pikir Dulu", "left": "Sebaiknya Tunai" },
    "items": [
      { "id": "i1", "label": "Kebutuhan mendesak yang bisa dilunasi bulan ini", "best": "Layak Kredit", "emoji": "✅" },
      { "id": "i2", "label": "Cicilan barang elektronik sesuai kemampuan bayar", "best": "Layak Kredit", "emoji": "💳" },
      { "id": "i3", "label": "Barang diskon yang belum tentu dibutuhkan", "best": "Sebaiknya Tunai", "emoji": "🛍️" },
      { "id": "i4", "label": "Nominal besar yang belum pasti bisa dilunasi", "best": "Pikir Dulu", "emoji": "🤔" },
      { "id": "i5", "label": "Kebutuhan sehari-hari yang seharusnya dari gaji", "best": "Sebaiknya Tunai", "emoji": "🍚" },
      { "id": "i6", "label": "Tagihan yang sudah menumpuk di platform lain", "best": "Sebaiknya Tunai", "emoji": "⚠️" }
    ],
    "badge": { "code": "layak-kredit", "title": "Paham Layak Kredit" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 40 — Cari Lapisan Proteksi Keuangan (hidden_object) · Edisi 14: Proteksi Keuangan
-- "Dana darurat, asuransi kesehatan, asuransi jiwa, dokumen keuangan
-- keluarga" -- semua lapisan proteksi dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q040',
  'Cari Lapisan Proteksi Keuangan',
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
      { "id": "t4", "label": "Dokumen keuangan keluarga yang rapi", "emoji": "📁" }
    ],
    "decoys": [
      { "id": "d1", "label": "Saham gorengan", "emoji": "📉" },
      { "id": "d2", "label": "Kartu kredit tanpa batas", "emoji": "💳" },
      { "id": "d3", "label": "Investasi tanpa izin OJK", "emoji": "🚫" },
      { "id": "d4", "label": "Belanja impulsif", "emoji": "🛒" }
    ],
    "badge": { "code": "penjaga-proteksi", "title": "Penjaga Proteksi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 41 — Radar Risiko Belum Terlindungi (quick_reaction) · Edisi 14: Proteksi Keuangan
-- "Mengidentifikasi risiko yang belum terlindungi."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q041',
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
-- Quest 42 — Simulasi Siapkan Proteksi Keluarga (simulation) · Edisi 14: Proteksi Keuangan
-- "Proteksi disesuaikan kebutuhan & kemampuan" + "pahami manfaat dan
-- pengecualian sebelum membeli produk."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q042',
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
-- Hubungkan quest ke campaign CR-C08, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q037', 10), ('Q038', 20), ('Q039', 30), ('Q040', 40), ('Q041', 50), ('Q042', 60)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C08'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
