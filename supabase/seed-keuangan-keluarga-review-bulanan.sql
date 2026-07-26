-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Keuangan Keluarga & Review Bulanan"
-- Mengcover Edisi 15 (Keuangan Keluarga) dan Edisi 16 (Review Keuangan
-- Bulanan) dari docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md --
-- edisi terakhir dari seri 1-16, jadi campaign penutup.
--
-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang (upsert
-- lewat ON CONFLICT).
--
-- Kedua edisi ini PALING dalam di antara seluruh seri (8 "Konsep Penting"
-- masing-masing, lebih banyak dari edisi lain) -- makanya dibagi 4 quest
-- per edisi, total 8 quest (maksimum). Tipe mekanik sengaja dipilih supaya
-- SEMUA 8 tipe yang tersisa (di luar budget_slider & swipe_cards yang
-- sudah cukup sering dipakai) terpakai masing-masing tepat sekali:
-- scenario_choice, tap_select, timeline_sort, match_pairs (Edisi 15) +
-- simulation, quick_reaction, memory_cards, hidden_object (Edisi 16).
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain
-- sama sekali. Aktifkan lewat supabase/scripts/04-update-campaign-status.sql
-- Skenario B kalau sudah siap tayang.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C09',
  'Cageur Rekening Quest — Keuangan Keluarga & Review Bulanan',
  'Latihan mengelola keuangan keluarga lewat komunikasi dan kesepakatan bersama, lalu menutup dengan kebiasaan review keuangan tiap bulan.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 43 — Beda Prioritas dengan Pasangan (scenario_choice) · Edisi 15: Keuangan Keluarga
-- "Menentukan respons sehat dalam perbedaan prioritas pasangan" --
-- contoh pengembangan kuis persis dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q043',
  'Beda Prioritas dengan Pasangan',
  'Pilih respons paling sehat saat beda prioritas keuangan',
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
        "prompt": "Kamu dan pasangan beda pendapat soal prioritas: kamu mau nabung dulu, pasangan mau renovasi rumah sekarang.",
        "options": [
          { "id": "o1", "label": "Diskusikan bareng, cari titik tengah yang disepakati berdua", "correct": true, "feedback": "Betul, perbedaan prioritas sebaiknya diselesaikan lewat diskusi bareng, bukan sepihak." },
          { "id": "o2", "label": "Jalankan rencanamu sendiri tanpa diskusi lebih lanjut", "correct": false, "feedback": "Keputusan sepihak soal keuangan keluarga bisa menimbulkan masalah komunikasi di kemudian hari." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Ada pengeluaran besar yang belum pernah dibicarakan bareng pasangan.",
        "options": [
          { "id": "o1", "label": "Bicarakan dulu bareng sebelum diputuskan", "correct": true, "feedback": "Tepat, pengeluaran besar sebaiknya dibahas bersama sebelum diputuskan." },
          { "id": "o2", "label": "Putuskan sendiri saja, toh uangnya dari gajimu", "correct": false, "feedback": "Keuangan keluarga sebaiknya dibahas bersama, terutama untuk pengeluaran besar." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Kamu punya utang yang belum diberitahukan ke pasangan.",
        "options": [
          { "id": "o1", "label": "Jujur dan bicarakan bareng, cari solusi bersama", "correct": true, "feedback": "Betul, menyembunyikan utang atau kewajiban bisa merusak kepercayaan dalam keluarga." },
          { "id": "o2", "label": "Simpan sendiri, selesaikan diam-diam", "correct": false, "feedback": "Menyembunyikan utang berisiko -- lebih baik jujur dan diselesaikan bersama." }
        ]
      }
    ],
    "badge": { "code": "komunikasi-keuangan", "title": "Komunikasi Keuangan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 44 — Topik yang Perlu Dibahas Bareng Pasangan (tap_select) · Edisi 15: Keuangan Keluarga
-- "Memilih hal yang perlu dibahas dalam pertemuan keuangan keluarga" --
-- contoh pengembangan kuis persis dari materi.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q044',
  'Topik yang Perlu Dibahas Bareng Pasangan',
  'Tap semua topik yang perlu dibahas bareng pasangan',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua topik yang perlu dibahas bareng pasangan soal keuangan keluarga.",
    "cards": [
      { "id": "c1", "label": "Pemasukan dan pengeluaran bersama", "healthy": true, "emoji": "💬" },
      { "id": "c2", "label": "Kewajiban dan cicilan yang sedang berjalan", "healthy": true, "emoji": "🏦" },
      { "id": "c3", "label": "Dukungan untuk anak atau orang tua", "healthy": true, "emoji": "👨‍👩‍👧" },
      { "id": "c4", "label": "Jadwal rutin ngobrolin keuangan", "healthy": true, "emoji": "📅" },
      { "id": "c5", "label": "Menyembunyikan utang biar tidak dimarahi", "healthy": false, "emoji": "🙈" },
      { "id": "c6", "label": "Menghindari topik keuangan sama sekali", "healthy": false, "emoji": "🚫" },
      { "id": "c7", "label": "Memutuskan pengeluaran besar sendirian", "healthy": false, "emoji": "🙅" }
    ],
    "badge": { "code": "topik-keuangan-keluarga", "title": "Topik Keuangan Keluarga" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 45 — Langkah Bikin Kesepakatan Keuangan Keluarga (timeline_sort) · Edisi 15: Keuangan Keluarga
-- Urutan sesuai "Konsep Penting": bahas bersama -> sepakati prioritas ->
-- batas belanja pribadi -> jadwalkan pembicaraan rutin.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q045',
  'Langkah Bikin Kesepakatan Keuangan Keluarga',
  'Urutkan langkah membangun kesepakatan keuangan keluarga',
  'timeline_sort',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Urutkan langkah membangun kesepakatan keuangan keluarga dari yang paling awal.",
    "items": [
      { "id": "t1", "label": "Bahas pemasukan dan pengeluaran bersama", "order": 1, "emoji": "💬" },
      { "id": "t2", "label": "Sepakati prioritas keluarga", "order": 2, "emoji": "🤝" },
      { "id": "t3", "label": "Tetapkan batas belanja pribadi", "order": 3, "emoji": "💳" },
      { "id": "t4", "label": "Jadwalkan pembicaraan keuangan rutin", "order": 4, "emoji": "📅" }
    ],
    "badge": { "code": "runut-kesepakatan", "title": "Runut Kesepakatan Keluarga" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 46 — Jodoh Situasi & Respons Sehat (match_pairs) · Edisi 15: Keuangan Keluarga
-- Menguatkan pemahaman respons sehat lewat contoh situasi keluarga
-- konkret.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q046',
  'Jodoh Situasi & Respons Sehat',
  'Cocokkan situasi keluarga dengan respons yang paling sehat',
  'match_pairs',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Jodohkan situasi keluarga dengan respons yang paling sehat.",
    "pairs": [
      { "id": "p1", "left": "Beda prioritas soal pengeluaran besar", "right": "Diskusikan dan cari kesepakatan bersama", "emoji": "🤝" },
      { "id": "p2", "left": "Ada utang yang belum diketahui pasangan", "right": "Jujur dan selesaikan bareng", "emoji": "🗣️" },
      { "id": "p3", "left": "Perlu dukungan dana buat orang tua", "right": "Dibicarakan dan disepakati bareng", "emoji": "👨‍👩‍👧" },
      { "id": "p4", "left": "Ingin belanja pribadi tanpa mengganggu keuangan keluarga", "right": "Tetapkan batas belanja pribadi", "emoji": "💳" }
    ],
    "badge": { "code": "jodoh-respons-keluarga", "title": "Jodoh Respons Keluarga" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 47 — Simulasi Review Keuangan Bulanan (simulation) · Edisi 16: Review Keuangan Bulanan
-- "Identifikasi pengeluaran terbesar" + "pastikan tagihan aman" + "pilih
-- satu perbaikan kecil untuk bulan berikutnya."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q047',
  'Simulasi Review Keuangan Bulanan',
  'Ambil keputusan tahap demi tahap saat review akhir bulan',
  'simulation',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Ambil keputusan tiap tahap saat melakukan review keuangan akhir bulan.",
    "steps": [
      {
        "id": "st1",
        "label": "Akhir bulan tiba, kamu mau review keuangan. Apa yang pertama dicek?",
        "options": [
          { "id": "op1", "label": "Identifikasi pengeluaran terbesar bulan ini", "impact": 1 },
          { "id": "op2", "label": "Langsung cek saldo rekening saja", "impact": 0.3 }
        ]
      },
      {
        "id": "st2",
        "label": "Setelah itu, apa yang perlu dipastikan aman?",
        "options": [
          { "id": "op1", "label": "Pastikan semua tagihan dan cicilan sudah/akan terbayar tepat waktu", "impact": 1 },
          { "id": "op2", "label": "Abaikan tagihan, yang penting saldo masih ada", "impact": 0.1 }
        ]
      },
      {
        "id": "st3",
        "label": "Setelah review, apa langkah terakhir yang paling penting?",
        "options": [
          { "id": "op1", "label": "Pilih satu perbaikan kecil buat dicoba bulan depan", "impact": 1 },
          { "id": "op2", "label": "Tidak perlu ada perubahan apa-apa", "impact": 0.2 }
        ]
      }
    ],
    "badge": { "code": "review-cageur", "title": "Review Cageur" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 48 — Radar Red Flag Bulan Ini (quick_reaction) · Edisi 16: Review Keuangan Bulanan
-- "Periksa pengeluaran impulsif" + "periksa perkembangan tabungan dan
-- dana darurat."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q048',
  'Radar Red Flag Bulan Ini',
  'Tap cepat tanda red flag keuangan, tahan yang masih sehat',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul tanda red flag keuangan bulan ini, tahan saat muncul kondisi yang masih sehat.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Pengeluaran impulsif menumpuk tanpa disadari", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Tagihan hampir lewat jatuh tempo", "isTarget": true, "emoji": "⏰" },
      { "id": "r3", "label": "Dana darurat berkurang tanpa dicatat kenapa", "isTarget": true, "emoji": "⚠️" },
      { "id": "r4", "label": "Tabungan bertambah dibanding bulan lalu", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Semua tagihan lunas tepat waktu", "isTarget": false, "emoji": "📝" }
    ],
    "badge": { "code": "radar-review", "title": "Radar Review" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 49 — Ingat Checklist Review Bulanan (memory_cards) · Edisi 16: Review Keuangan Bulanan
-- "Review tidak harus rumit" -- kenalan sama 4 hal inti yang perlu dicek
-- tiap bulan.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q049',
  'Ingat Checklist Review Bulanan',
  'Buka kartu dan temukan pasangan checklist review bulanan',
  'memory_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Buka kartu dan temukan semua pasangan checklist review keuangan bulanan.",
    "pairs": [
      { "id": "m1", "label": "Pengeluaran Terbesar", "emoji": "💸" },
      { "id": "m2", "label": "Tagihan & Cicilan", "emoji": "🧾" },
      { "id": "m3", "label": "Dana Darurat", "emoji": "🛡️" },
      { "id": "m4", "label": "Target Keuangan", "emoji": "🎯" }
    ],
    "badge": { "code": "ingat-checklist-review", "title": "Ingat Checklist Review" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 50 — Cari Pengeluaran Impulsif Bulan Ini (hidden_object) · Edisi 16: Review Keuangan Bulanan
-- "Periksa pengeluaran impulsif" -- penutup seri 1-16.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q050',
  'Cari Pengeluaran Impulsif Bulan Ini',
  'Temukan semua pengeluaran impulsif dalam waktu terbatas',
  'hidden_object',
  'active',
  25,
  1,
  false,
  '{
    "instruction": "Dalam 30 detik, tap semua pengeluaran yang termasuk impulsif bulan ini.",
    "timeLimitSeconds": 30,
    "targets": [
      { "id": "t1", "label": "Checkout dadakan karena flash sale", "emoji": "⚡" },
      { "id": "t2", "label": "Langganan yang lupa dibatalkan", "emoji": "📱" },
      { "id": "t3", "label": "Jajan berulang di luar rencana", "emoji": "🍔" },
      { "id": "t4", "label": "Belanja ikut-ikutan tren teman", "emoji": "👥" }
    ],
    "decoys": [
      { "id": "d1", "label": "Belanja kebutuhan pokok bulanan", "emoji": "🧾" },
      { "id": "d2", "label": "Bayar cicilan rutin", "emoji": "🏦" },
      { "id": "d3", "label": "Setoran tabungan/dana darurat", "emoji": "🐷" },
      { "id": "d4", "label": "Dana pendidikan yang sudah direncanakan", "emoji": "🎓" }
    ],
    "badge": { "code": "sadar-impulsif", "title": "Sadar Impulsif" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C09, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q043', 10), ('Q044', 20), ('Q045', 30), ('Q046', 40),
  ('Q047', 50), ('Q048', 60), ('Q049', 70), ('Q050', 80)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C09'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
