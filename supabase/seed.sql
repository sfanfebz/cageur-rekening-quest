-- Cageur Rekening Quest — seed data awal
-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang (pakai upsert
-- lewat ON CONFLICT), jadi bisa dipakai juga untuk memperbarui campaign/quest
-- awal tanpa duplikasi baris.

-- ---------------------------------------------------------------------------
-- Campaign 1 — Cageur Rekening Quest: Cek dan Atur Keuangan
-- ---------------------------------------------------------------------------
insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C01',
  'Cageur Rekening Quest — Cek dan Atur Keuangan',
  'Cek kondisi keuangan, temukan bocor halus, atur budget, dan tahan checkout yang kurang perlu.',
  'active',
  now()
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

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
      { "id": "i1", "label": "Obat", "best": "Checkout", "emoji": "💊" },
      { "id": "i2", "label": "Kebutuhan dapur", "best": "Checkout", "emoji": "🥘" },
      { "id": "i3", "label": "Pulsa/internet", "best": "Checkout", "emoji": "📶" },
      { "id": "i4", "label": "Sepatu kerja rusak", "best": "Checkout", "emoji": "👞" },
      { "id": "i5", "label": "Hadiah yang direncanakan", "best": "Checkout", "emoji": "🎁" },
      { "id": "i6", "label": "Buku pengembangan diri", "best": "Tunda 24 Jam", "emoji": "📚" },
      { "id": "i7", "label": "Baju diskon", "best": "Tunda 24 Jam", "emoji": "👕" },
      { "id": "i8", "label": "Gadget karena ikut tren", "best": "Tunda 24 Jam", "emoji": "📱" },
      { "id": "i9", "label": "Dekorasi promo", "best": "Keluarkan", "emoji": "🖼️" },
      { "id": "i10", "label": "Cemilan promo", "best": "Keluarkan", "emoji": "🍟" },
      { "id": "i11", "label": "Tas flash sale", "best": "Keluarkan", "emoji": "👜" },
      { "id": "i12", "label": "Barang viral", "best": "Keluarkan", "emoji": "🔥" }
    ],
    "badge": { "code": "anti-lapar-mata", "title": "Anti Lapar Mata" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C01, urut sequential
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

-- ---------------------------------------------------------------------------
-- Contoh campaign berikutnya berstatus upcoming, ditampilkan di tab
-- "Segera Hadir" pada Game Hub. Tidak punya quest sehingga tidak dapat
-- dimainkan. Hapus atau ubah statusnya lewat Table Editor kapan pun.
-- ---------------------------------------------------------------------------
insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C02',
  'Cageur Rekening Quest — Tujuan dan Proteksi',
  'Rangkaian misi lanjutan seputar tujuan keuangan dan proteksi diri. Segera hadir.',
  'upcoming',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title, description = excluded.description, status = excluded.status;
