-- =============================================================================
-- Cageur Rekening Quest — update seed campaign CR-C01
-- "Cageur Rekening Quest — Cek dan Atur Keuangan"
--
-- CR-C01 sudah ada sejak awal di supabase/seed.sql (status 'active'), file
-- ini KHUSUS untuk memperbarui isi ke-4 quest-nya (Q001-Q004) tanpa
-- menyentuh baris campaigns-nya sama sekali -- status/start_at CR-C01
-- tetap seperti apa adanya di database, tidak ikut di-reset oleh script
-- ini. Aman dijalankan berkali-kali (upsert lewat ON CONFLICT).
--
-- Isi perubahan:
-- 1. Menegaskan ulang field "emoji" di SETIAP kartu/item pada Q001-Q004 --
--    berguna kalau database live kamu masih hasil seed versi lama sebelum
--    emoji dilengkapi (repo saat ini sebenarnya sudah lengkap emoji,
--    tapi database live bisa saja ketinggalan versi).
-- 2. Q004 "Checkout Battle" (swipe_cards): label tiap item disempurnakan
--    jadi frasa yang lebih deskriptif/kontekstual (bukan cuma nama
--    barang polos), konsisten dengan gaya quest di campaign-campaign
--    yang lebih baru.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Quest 1 — Dompet Cageur Scanner (tap_select)
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q001',
  'Dompet Cageur Scanner',
  'Tap kebiasaan yang bikin rekening sehat',
  'tap_select',
  'active',
  25,
  1,
  false,
  '{
    "instruction": "Kang Cageur nemu beberapa kebiasaan finansial. Tap semua kebiasaan yang bikin rekening makin sehat.",
    "cards": [
      { "id": "c1", "label": "Pengeluaran lebih kecil dari penghasilan", "healthy": true, "emoji": "📉" },
      { "id": "c2", "label": "Punya dana darurat", "healthy": true, "emoji": "🛡️" },
      { "id": "c3", "label": "Cicilan masih terkendali", "healthy": true, "emoji": "📋" },
      { "id": "c4", "label": "Ada tabungan rutin", "healthy": true, "emoji": "🐷" },
      { "id": "c5", "label": "Sering bingung uang habis ke mana", "healthy": false, "emoji": "😵" },
      { "id": "c6", "label": "Menabung hanya kalau ada sisa", "healthy": false, "emoji": "🤷" },
      { "id": "c7", "label": "Tidak tahu total cicilan", "healthy": false, "emoji": "🌀" },
      { "id": "c8", "label": "Sering belanja impulsif", "healthy": false, "emoji": "🛍️" },
      { "id": "c9", "label": "Mencatat pengeluaran harian", "healthy": true, "emoji": "📝" },
      { "id": "c10", "label": "Punya tujuan keuangan", "healthy": true, "emoji": "🎯" }
    ],
    "badge": { "code": "dompet-cageur", "title": "Dompet Cageur" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 2 — Bocor Halus Hunt (hidden_object)
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q002',
  'Bocor Halus Hunt',
  'Temukan pengeluaran kecil yang bisa jadi bocor halus',
  'hidden_object',
  'active',
  25,
  1,
  false,
  '{
    "instruction": "Dalam 30 detik, tap pengeluaran kecil yang bisa jadi bocor halus kalau sering dan tidak dicatat.",
    "timeLimitSeconds": 30,
    "targets": [
      { "id": "t1", "label": "Kopi harian", "emoji": "☕" },
      { "id": "t2", "label": "Jajan promo", "emoji": "🍪" },
      { "id": "t3", "label": "Checkout barang lucu", "emoji": "🛒" },
      { "id": "t4", "label": "Parkir dan biaya kecil-kecil", "emoji": "🅿️" },
      { "id": "t5", "label": "Flash sale", "emoji": "⚡" },
      { "id": "t6", "label": "Langganan aplikasi yang jarang dipakai", "emoji": "📱" }
    ],
    "decoys": [
      { "id": "d1", "label": "Makan harian", "emoji": "🍚" },
      { "id": "d2", "label": "Transportasi", "emoji": "🚌" },
      { "id": "d3", "label": "Listrik dan internet", "emoji": "💡" },
      { "id": "d4", "label": "Cicilan", "emoji": "🏦" },
      { "id": "d5", "label": "Dana darurat", "emoji": "🛡️" },
      { "id": "d6", "label": "Tabungan rumah", "emoji": "🏠" }
    ],
    "badge": { "code": "detektif-bocor-halus", "title": "Detektif Bocor Halus" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 3 — Budget Rush (budget_slider)
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q003',
  'Budget Rush',
  'Bagi 100 koin gaji ke pos yang tepat',
  'budget_slider',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Kamu punya 100 koin gaji. Bagi ke pos yang tepat sebelum keburu habis.",
    "totalCoins": 100,
    "categories": [
      { "id": "kebutuhan", "label": "Kebutuhan utama", "emoji": "🧾", "idealMin": 40, "idealMax": 60, "warningMin": 30, "warningMax": 70 },
      { "id": "cicilan", "label": "Cicilan dan kewajiban", "emoji": "🏦", "idealMin": 0, "idealMax": 30, "warningMin": 0, "warningMax": 40 },
      { "id": "tabungan", "label": "Tabungan/dana darurat", "emoji": "🐷", "idealMin": 15, "idealMax": 35, "warningMin": 10, "warningMax": 45 },
      { "id": "hiburan", "label": "Hiburan/gaya hidup", "emoji": "🎮", "idealMin": 5, "idealMax": 20, "warningMin": 0, "warningMax": 30 }
    ],
    "badge": { "code": "jago-atur-budget", "title": "Jago Atur Budget" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 4 — Checkout Battle (swipe_cards)
-- Label tiap item disempurnakan jadi frasa deskriptif/kontekstual (bukan
-- cuma nama barang polos) supaya lebih jelas ALASAN di balik kategorinya,
-- konsisten dengan gaya quest campaign yang lebih baru.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q004',
  'Checkout Battle',
  'Swipe setiap barang ke keputusan paling bijak',
  'swipe_cards',
  'active',
  30,
  1,
  false,
  '{
    "instruction": "Swipe setiap barang ke keputusan yang paling bijak.",
    "directions": { "right": "Checkout", "up": "Tunda 24 Jam", "left": "Keluarkan" },
    "items": [
      { "id": "i1", "label": "Obat yang lagi dibutuhkan sekarang", "best": "Checkout", "emoji": "💊" },
      { "id": "i2", "label": "Belanja kebutuhan dapur bulanan", "best": "Checkout", "emoji": "🥘" },
      { "id": "i3", "label": "Isi pulsa/internet buat kerja", "best": "Checkout", "emoji": "📶" },
      { "id": "i4", "label": "Sepatu kerja yang sudah rusak", "best": "Checkout", "emoji": "👞" },
      { "id": "i5", "label": "Hadiah ulang tahun yang sudah direncanakan", "best": "Checkout", "emoji": "🎁" },
      { "id": "i6", "label": "Buku pengembangan diri yang lagi diminati", "best": "Tunda 24 Jam", "emoji": "📚" },
      { "id": "i7", "label": "Baju diskon yang belum tentu dipakai", "best": "Tunda 24 Jam", "emoji": "👕" },
      { "id": "i8", "label": "Gadget baru karena ikut tren teman", "best": "Tunda 24 Jam", "emoji": "📱" },
      { "id": "i9", "label": "Dekorasi rumah yang lagi promo", "best": "Keluarkan", "emoji": "🖼️" },
      { "id": "i10", "label": "Cemilan promo yang menggoda", "best": "Keluarkan", "emoji": "🍟" },
      { "id": "i11", "label": "Tas flash sale limited edition", "best": "Keluarkan", "emoji": "👜" },
      { "id": "i12", "label": "Barang yang lagi viral di media sosial", "best": "Keluarkan", "emoji": "🔥" }
    ],
    "badge": { "code": "anti-lapar-mata", "title": "Anti Lapar Mata" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C01, urut sequential (menegaskan ulang --
-- keterkaitan ini sudah ada sejak seed.sql awal, upsert di sini aman).
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values ('Q001', 1), ('Q002', 2), ('Q003', 3), ('Q004', 4)) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C01'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
