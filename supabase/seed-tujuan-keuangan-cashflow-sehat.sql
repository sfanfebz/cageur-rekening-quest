-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Tujuan Keuangan & Cash Flow Sehat"
-- Mengcover Edisi 9 (Financial Goal) dan Edisi 10 (Cash Flow Sehat) dari
-- docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md.
--
-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang (upsert
-- lewat ON CONFLICT).
--
-- Kedua edisi punya kedalaman setara (7 "Konsep Penting" masing-masing) --
-- dibagi rata 3 quest per edisi, total 6 quest. Tipe mekanik dipilih
-- beda-beda dalam satu campaign ini: tap_select, timeline_sort, match_pairs
-- (Edisi 9) + simulation, quick_reaction, scenario_choice (Edisi 10).
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain
-- sama sekali. Aktifkan lewat supabase/scripts/04-update-campaign-status.sql
-- Skenario B kalau sudah siap tayang.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C06',
  'Cageur Rekening Quest — Tujuan Keuangan & Cash Flow Sehat',
  'Latihan menetapkan tujuan keuangan yang jelas dan terukur, lalu memahami arus uang masuk dan keluar secara nyata.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 25 — Ciri Tujuan Keuangan Cageur (tap_select) · Edisi 9: Financial Goal
-- "Tentukan apa yang ingin dicapai" -- kenali ciri tujuan yang spesifik &
-- terukur vs yang masih terlalu umum/samar.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q025',
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
-- Quest 26 — Langkah Menetapkan Tujuan (timeline_sort) · Edisi 9: Financial Goal
-- Urutan sesuai "Konsep Penting": tentukan apa yang dicapai -> kapan ->
-- hitung kebutuhan dana -> hitung kontribusi rutin.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q026',
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
-- Quest 27 — Jodoh Tujuan & Jangka Waktu (match_pairs) · Edisi 9: Financial Goal
-- "Bedakan tujuan jangka pendek, menengah, dan panjang."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q027',
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
-- Quest 28 — Simulasi Baca Cash Flow Bulanan (simulation) · Edisi 10: Cash Flow Sehat
-- "Catat pemasukan/kebutuhan wajib/cicilan" + "identifikasi pengeluaran
-- yang terlalu besar."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q028',
  'Simulasi Baca Cash Flow Bulanan',
  'Ambil keputusan tahap demi tahap membaca cash flow bulanan',
  'simulation',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Ambil keputusan tiap tahap untuk membaca kondisi cash flow bulananmu.",
    "steps": [
      {
        "id": "st1",
        "label": "Awal bulan, kamu mau cek kondisi keuangan. Apa yang pertama dicek?",
        "options": [
          { "id": "op1", "label": "Catat semua pemasukan bulan ini", "impact": 1 },
          { "id": "op2", "label": "Langsung cek saldo di ATM saja", "impact": 0.3 }
        ]
      },
      {
        "id": "st2",
        "label": "Setelah tahu pemasukan, apa langkah berikutnya?",
        "options": [
          { "id": "op1", "label": "Catat kebutuhan wajib & cicilan yang harus dibayar", "impact": 1 },
          { "id": "op2", "label": "Langsung belanja dulu, catat belakangan", "impact": 0.2 }
        ]
      },
      {
        "id": "st3",
        "label": "Setelah dihitung, ternyata pengeluaran lebih besar dari pemasukan. Apa yang dilakukan?",
        "options": [
          { "id": "op1", "label": "Cari pos mana yang bisa dikurangi bulan ini", "impact": 1 },
          { "id": "op2", "label": "Dibiarkan saja, semoga bulan depan membaik", "impact": 0.1 }
        ]
      }
    ],
    "badge": { "code": "paham-cashflow", "title": "Paham Cash Flow" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 29 — Radar Cash Flow Bermasalah (quick_reaction) · Edisi 10: Cash Flow Sehat
-- "Cash flow positif berarti pemasukan masih lebih besar dari
-- pengeluaran" + "identifikasi pengeluaran yang terlalu besar."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q029',
  'Radar Cash Flow Bermasalah',
  'Tap cepat tanda cash flow bermasalah, tahan yang masih sehat',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul tanda cash flow bermasalah, tahan saat muncul kondisi yang masih sehat.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Pengeluaran lebih besar dari pemasukan tiap bulan", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Tidak pernah dicatat sama sekali dari bulan ke bulan", "isTarget": true, "emoji": "❓" },
      { "id": "r3", "label": "Cicilan menumpuk tanpa pernah dihitung ulang", "isTarget": true, "emoji": "⚠️" },
      { "id": "r4", "label": "Pemasukan masih lebih besar dari pengeluaran", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Dicatat sederhana tiap bulan, walau tidak detail", "isTarget": false, "emoji": "📝" }
    ],
    "badge": { "code": "radar-cashflow", "title": "Radar Cash Flow" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 30 — Saat Pengeluaran Lebih Besar dari Pemasukan (scenario_choice) · Edisi 10: Cash Flow Sehat
-- "Menentukan tindakan saat pengeluaran lebih besar dari pemasukan" --
-- contoh pengembangan kuis persis dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q030',
  'Saat Pengeluaran Lebih Besar dari Pemasukan',
  'Pilih respons paling tepat saat cash flow negatif',
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
        "prompt": "Kamu sadar pengeluaran bulan ini lebih besar dari pemasukan.",
        "options": [
          { "id": "o1", "label": "Cari pos yang bisa dikurangi dan catat lebih rutin", "correct": true, "feedback": "Betul, langkah pertama adalah mencari pos mana yang bisa disesuaikan." },
          { "id": "o2", "label": "Tutup dengan utang baru supaya tetap bisa belanja seperti biasa", "correct": false, "feedback": "Menutup dengan utang baru cuma menunda masalah, bukan menyelesaikannya." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Kamu belum pernah mencatat pemasukan dan pengeluaran sama sekali.",
        "options": [
          { "id": "o1", "label": "Mulai dari catatan sederhana, tidak perlu langsung detail", "correct": true, "feedback": "Tepat, catatan sederhana jauh lebih baik daripada tidak mencatat sama sekali." },
          { "id": "o2", "label": "Tunda sampai punya aplikasi pencatatan yang paling lengkap", "correct": false, "feedback": "Menunggu alat \"sempurna\" cuma menunda kebiasaan mencatat yang sebenarnya sudah bisa dimulai sekarang." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Salah satu pos pengeluaranmu ternyata jauh lebih besar dari perkiraan.",
        "options": [
          { "id": "o1", "label": "Identifikasi penyebabnya dan evaluasi pos itu", "correct": true, "feedback": "Betul, identifikasi pos yang terlalu besar itu bagian penting dari cash flow sehat." },
          { "id": "o2", "label": "Abaikan saja, yang penting masih ada sisa uang", "correct": false, "feedback": "Pos yang membengkak sebaiknya dievaluasi supaya tidak berulang bulan depan." }
        ]
      }
    ],
    "badge": { "code": "sigap-cashflow", "title": "Sigap Cash Flow" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C06, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q025', 10), ('Q026', 20), ('Q027', 30), ('Q028', 40), ('Q029', 50), ('Q030', 60)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C06'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
