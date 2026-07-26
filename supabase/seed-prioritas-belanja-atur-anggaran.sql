-- =============================================================================
-- Cageur Rekening Quest — seed quest untuk campaign CR-C02
-- "Prioritas Belanja & Atur Anggaran"
--
-- Menggantikan rencana isi CR-C02 sebelumnya ("Tujuan dan Proteksi" / Edisi
-- 9 & 14, dari supabase/seed-tujuan-dan-proteksi.sql -- file itu dihapus).
-- Judul baru & isi baru ini mengcover Edisi 2 (Butuh, Pengen, atau
-- Prioritas) dan Edisi 3 (Budgeting Simpel) dari
-- docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md. Judul campaign-nya
-- juga sudah diperbarui langsung di supabase/seed.sql.
--
-- CATATAN: Edisi 3 sudah pernah disentuh sebagian oleh CR-C03 (seed-atur-
-- anggaran-dana-darurat.sql, Edisi 3-4) lewat quest timeline_sort +
-- match_pairs. Di sini Edisi 3 dibahas ulang dengan mekanik & sudut
-- pandang berbeda (budget_slider/simulation/quick_reaction) sesuai
-- permintaan eksplisit -- bukan duplikasi tidak sengaja.
--
-- Jalankan setelah supabase/schema.sql DAN supabase/seed.sql (campaign
-- CR-C02 harus sudah ada). Aman dijalankan ulang. Langkah pertama script
-- ini MENGHAPUS 10 quest lama Q013-Q022 beserta seluruh keterkaitannya
-- (campaign_quests, participant_quest_progress ikut terhapus otomatis
-- lewat on delete cascade di schema.sql) -- aman karena CR-C02 belum
-- pernah berstatus 'active' sehingga belum ada peserta yang memainkannya.
-- Tidak menyentuh baris campaigns CR-C02 sendiri -- statusnya tetap
-- 'upcoming' sampai diaktifkan lewat
-- supabase/scripts/04-update-campaign-status.sql Skenario B saat mau dites.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Hapus 10 quest lama (Q013-Q022, rencana "Tujuan dan Proteksi") beserta
-- seluruh baris campaign_quests/participant_quest_progress yang menunjuk
-- ke sana (cascade otomatis lewat FK di schema.sql).
-- ---------------------------------------------------------------------------
delete from quests
where quest_code in ('Q013', 'Q014', 'Q015', 'Q016', 'Q017', 'Q018', 'Q019', 'Q020', 'Q021', 'Q022');

-- ---------------------------------------------------------------------------
-- Quest 13 — Butuh, Pengen, atau Prioritas? (swipe_cards) · Edisi 2
-- "Mengelompokkan pengeluaran menjadi butuh, pengen, atau prioritas" --
-- contoh pengembangan kuis persis dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q013',
  'Butuh, Pengen, atau Prioritas?',
  'Swipe tiap pengeluaran ke kategori yang paling tepat',
  'swipe_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Swipe tiap pengeluaran ke kategori yang paling tepat: Butuh, Prioritas, atau Pengen.",
    "directions": { "right": "Butuh", "up": "Prioritas", "left": "Pengen" },
    "items": [
      { "id": "i1", "label": "Beli beras dan lauk buat seminggu", "best": "Butuh", "emoji": "🍚" },
      { "id": "i2", "label": "Bayar cicilan motor bulan ini", "best": "Prioritas", "emoji": "🏍️" },
      { "id": "i3", "label": "Sepatu baru model limited edition", "best": "Pengen", "emoji": "👟" },
      { "id": "i4", "label": "Obat buat anggota keluarga yang sakit", "best": "Butuh", "emoji": "💊" },
      { "id": "i5", "label": "Nabung buat dana pendidikan anak", "best": "Prioritas", "emoji": "🎓" },
      { "id": "i6", "label": "Gadget baru padahal yang lama masih bagus", "best": "Pengen", "emoji": "📱" }
    ],
    "badge": { "code": "kenal-prioritas", "title": "Kenal Prioritas" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 14 — Kebutuhan Mendesak vs Keinginan (scenario_choice) · Edisi 2
-- "Menentukan keputusan saat kebutuhan mendesak dan keinginan hadir
-- bersamaan" + "tunda pembelian jika masih ragu" + "promo bukan alasan
-- utama membeli."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q014',
  'Kebutuhan Mendesak vs Keinginan',
  'Pilih respons paling tepat saat butuh dan pengen hadir bersamaan',
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
        "prompt": "Kompor rusak pas mau masak buat keluarga, tapi ada juga flash sale gadget incaran hari ini.",
        "options": [
          { "id": "o1", "label": "Perbaiki/ganti kompor dulu, gadget bisa nunggu", "correct": true, "feedback": "Betul, kompor itu kebutuhan mendesak buat aktivitas sehari-hari." },
          { "id": "o2", "label": "Beli gadget dulu selagi diskon, kompor menyusul", "correct": false, "feedback": "Kompor lebih mendesak karena dipakai buat kebutuhan pokok sehari-hari." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Kamu lihat barang diskon besar, tapi belum yakin benar-benar butuh.",
        "options": [
          { "id": "o1", "label": "Tunda dulu, pikirkan sehari-dua sebelum beli", "correct": true, "feedback": "Betul, tunda pembelian kalau masih ragu itu langkah bijak." },
          { "id": "o2", "label": "Langsung beli karena takut promonya hilang", "correct": false, "feedback": "Promo bukan alasan utama buat beli -- tunda dulu kalau masih ragu." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Teman-teman kantor semua upgrade HP baru, HP kamu sebenarnya masih berfungsi normal.",
        "options": [
          { "id": "o1", "label": "Cek dulu apakah HP kamu benar-benar butuh diganti", "correct": true, "feedback": "Tepat, konteks kebutuhan pribadi lebih penting daripada ikut-ikutan." },
          { "id": "o2", "label": "Ikut beli biar tidak ketinggalan sama teman-teman", "correct": false, "feedback": "Ikut-ikutan bukan alasan kuat -- cek dulu kebutuhan sebenarnya." }
        ]
      }
    ],
    "badge": { "code": "sigap-prioritas", "title": "Sigap Prioritas" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 15 — Ciri Keputusan Belanja yang Bijak (tap_select) · Edisi 2
-- "Tunda pembelian jika masih ragu" + "promo bukan alasan utama membeli"
-- + "konteks dapat memengaruhi kategori suatu barang."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q015',
  'Ciri Keputusan Belanja yang Bijak',
  'Tap semua ciri keputusan belanja yang bijak',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua ciri keputusan belanja yang bijak.",
    "cards": [
      { "id": "c1", "label": "Ditunda dulu waktu masih ragu", "healthy": true, "emoji": "🤔" },
      { "id": "c2", "label": "Disesuaikan sama kebutuhan, bukan gengsi", "healthy": true, "emoji": "🎯" },
      { "id": "c3", "label": "Dipikirkan dampaknya ke anggaran lain", "healthy": true, "emoji": "📊" },
      { "id": "c4", "label": "Dicek dulu, bukan cuma karena diskon", "healthy": true, "emoji": "🔍" },
      { "id": "c5", "label": "Dibeli buru-buru karena takut kehabisan promo", "healthy": false, "emoji": "⚡" },
      { "id": "c6", "label": "Dibeli biar ikut tren teman-teman", "healthy": false, "emoji": "👥" },
      { "id": "c7", "label": "Dibeli tanpa mikir dampaknya ke pos lain", "healthy": false, "emoji": "🙈" }
    ],
    "badge": { "code": "bijak-belanja", "title": "Bijak Belanja" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 16 — Rancang Anggaran Bulanan (budget_slider) · Edisi 3
-- "Pos utama dapat mencakup kebutuhan pokok, cicilan/kewajiban,
-- tabungan/dana darurat, dan hiburan/gaya hidup" + "total alokasi harus
-- sesuai kemampuan."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q016',
  'Rancang Anggaran Bulanan',
  'Bagi 100 koin gaji ke pos anggaran yang seimbang',
  'budget_slider',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Kamu punya 100 koin gaji bulan ini. Bagi ke pos-pos utama supaya anggaranmu seimbang.",
    "totalCoins": 100,
    "categories": [
      { "id": "kebutuhan", "label": "Kebutuhan pokok", "emoji": "🧾", "idealMin": 40, "idealMax": 60, "warningMin": 30, "warningMax": 70 },
      { "id": "cicilan", "label": "Cicilan/kewajiban", "emoji": "🏦", "idealMin": 0, "idealMax": 30, "warningMin": 0, "warningMax": 40 },
      { "id": "tabungan", "label": "Tabungan/dana darurat", "emoji": "🐷", "idealMin": 15, "idealMax": 35, "warningMin": 10, "warningMax": 45 },
      { "id": "hiburan", "label": "Hiburan/gaya hidup", "emoji": "🎮", "idealMin": 5, "idealMax": 20, "warningMin": 0, "warningMax": 30 }
    ],
    "badge": { "code": "arsitek-anggaran", "title": "Arsitek Anggaran" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 17 — Sesuaikan Anggaran Saat Pendapatan Turun (simulation) · Edisi 3
-- "Menyesuaikan anggaran ketika pendapatan turun" -- contoh pengembangan
-- kuis persis dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q017',
  'Sesuaikan Anggaran Saat Pendapatan Turun',
  'Ambil keputusan tahap demi tahap saat pendapatan berkurang',
  'simulation',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Ambil keputusan tiap tahap saat pendapatan bulan ini tiba-tiba berkurang.",
    "steps": [
      {
        "id": "st1",
        "label": "Pendapatan bulan ini turun dari biasanya. Apa langkah pertamamu?",
        "options": [
          { "id": "op1", "label": "Tinjau ulang semua pos anggaran, lihat mana yang bisa disesuaikan", "impact": 1 },
          { "id": "op2", "label": "Anggaran dibiarkan sama seperti biasa", "impact": 0.2 }
        ]
      },
      {
        "id": "st2",
        "label": "Setelah ditinjau, pos mana yang paling masuk akal dikurangi dulu?",
        "options": [
          { "id": "op1", "label": "Hiburan/gaya hidup dulu, kebutuhan pokok tetap dijaga", "impact": 1 },
          { "id": "op2", "label": "Kurangi tabungan/dana darurat dulu", "impact": 0.3 }
        ]
      },
      {
        "id": "st3",
        "label": "Bulan depan pendapatan sudah normal lagi. Apa yang kamu lakukan?",
        "options": [
          { "id": "op1", "label": "Evaluasi lagi dan kembalikan alokasi ke kondisi seimbang", "impact": 1 },
          { "id": "op2", "label": "Biarkan anggaran tetap seperti saat pendapatan turun", "impact": 0.2 }
        ]
      }
    ],
    "badge": { "code": "adaptif-anggaran", "title": "Adaptif Anggaran" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 18 — Radar Pos Anggaran Boros (quick_reaction) · Edisi 3
-- "Evaluasi diperlukan jika satu pos terlalu besar" + "menentukan pos yang
-- perlu dikurangi ketika pengeluaran melebihi rencana."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q018',
  'Radar Pos Anggaran Boros',
  'Tap cepat tanda pos anggaran yang kebesaran, tahan yang masih wajar',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul tanda pos anggaran yang kebesaran, tahan saat muncul pos yang masih wajar.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Pos hiburan makan lebih dari separuh gaji", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Nggak pernah dievaluasi ulang dari bulan ke bulan", "isTarget": true, "emoji": "❓" },
      { "id": "r3", "label": "Cicilan sampai bikin kebutuhan pokok kekurangan", "isTarget": true, "emoji": "⚠️" },
      { "id": "r4", "label": "Tiap pos sesuai proporsi kemampuan", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Anggaran dievaluasi tiap akhir bulan", "isTarget": false, "emoji": "📅" }
    ],
    "badge": { "code": "radar-anggaran", "title": "Radar Anggaran" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C02, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q013', 10), ('Q014', 20), ('Q015', 30), ('Q016', 40), ('Q017', 50), ('Q018', 60)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C02'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
