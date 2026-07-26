-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Atur Anggaran & Dana Darurat"
-- Mengcover Edisi 3 (Budgeting Simpel) dan Edisi 4 (Dana Darurat) dari
-- docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md.
--
-- Jalankan setelah supabase/schema.sql (dan idealnya setelah supabase/seed.sql
-- kalau mau CR-C01 tetap ada sebagai riwayat). Aman dijalankan ulang (upsert
-- lewat ON CONFLICT).
--
-- Kedua edisi punya kedalaman setara (6 "Konsep Penting" masing-masing di
-- dokumen handoff) -- makanya dibagi rata 2 quest per edisi, total 4 quest.
-- Tipe mekanik sengaja dipilih dari 4 tipe yang BELUM PERNAH dipakai sama
-- sekali (timeline_sort, match_pairs, scenario_choice, simulation), beda
-- dari CR-C01 yang pakai tap_select/hidden_object/budget_slider/swipe_cards.
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain sama
-- sekali. Kalau sudah dicek isinya dan siap tayang, aktifkan lewat
-- supabase/scripts/04-update-campaign-status.sql Skenario B (otomatis
-- mengarsipkan campaign aktif lama).
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C03',
  'Cageur Rekening Quest — Atur Anggaran & Dana Darurat',
  'Latihan menyusun anggaran bulanan yang rapi dan menyiapkan dana darurat yang siap pakai kapan pun dibutuhkan.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 5 — Runut Susun Budget (timeline_sort) · Edisi 3: Budgeting Simpel
-- Urutan sesuai "Konsep Penting" Edisi 3: penghasilan dialokasikan sejak
-- awal, tabungan/dana darurat disisihkan lebih dulu (menguatkan prinsip
-- Edisi 6), baru kebutuhan wajib, sisanya hiburan/gaya hidup.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q005',
  'Runut Susun Budget',
  'Urutkan langkah menyusun anggaran bulanan',
  'timeline_sort',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Urutkan langkah menyusun anggaran bulanan dari yang paling awal.",
    "items": [
      { "id": "t1", "label": "Catat total penghasilan bulan ini", "order": 1, "emoji": "📝" },
      { "id": "t2", "label": "Sisihkan tabungan & dana darurat lebih dulu", "order": 2, "emoji": "🐷" },
      { "id": "t3", "label": "Bayar kebutuhan pokok & cicilan wajib", "order": 3, "emoji": "🧾" },
      { "id": "t4", "label": "Alokasikan sisanya untuk hiburan/gaya hidup", "order": 4, "emoji": "🎮" }
    ],
    "badge": { "code": "runut-anggaran", "title": "Runut Anggaran" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 6 — Jodoh Pos Anggaran (match_pairs) · Edisi 3: Budgeting Simpel
-- Menguatkan pemahaman 4 pos utama dari Edisi 3 lewat contoh konkret
-- pengeluaran sehari-hari.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q006',
  'Jodoh Pos Anggaran',
  'Cocokkan pos anggaran dengan contoh pengeluarannya',
  'match_pairs',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Jodohkan pos anggaran dengan contoh pengeluarannya.",
    "pairs": [
      { "id": "p1", "left": "Kebutuhan Pokok", "right": "Belanja bulanan & tagihan listrik", "emoji": "🧾" },
      { "id": "p2", "left": "Cicilan & Kewajiban", "right": "Cicilan motor atau kartu kredit", "emoji": "🏦" },
      { "id": "p3", "left": "Tabungan/Dana Darurat", "right": "Simpanan rutin tiap gajian", "emoji": "🐷" },
      { "id": "p4", "left": "Hiburan/Gaya Hidup", "right": "Nonton, jajan, atau langganan streaming", "emoji": "🎬" }
    ],
    "badge": { "code": "jodoh-pos-anggaran", "title": "Paham Pos Anggaran" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 7 — Kapan Pakai Dana Darurat (scenario_choice) · Edisi 4: Dana Darurat
-- Melatih membedakan kondisi mendesak (layak pakai dana darurat) vs
-- keinginan mendadak (bukan) -- sesuai "Batas Pembeda" Edisi 4.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q007',
  'Kapan Pakai Dana Darurat',
  'Kenali kondisi yang layak pakai dana darurat',
  'scenario_choice',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Pilih respons paling tepat untuk tiap situasi mendadak.",
    "scenarios": [
      {
        "id": "sc1",
        "prompt": "Motor tiba-tiba mogok dan harus diperbaiki besok pagi buat berangkat kerja.",
        "options": [
          { "id": "o1", "label": "Pakai dana darurat karena ini mendesak buat kerja", "correct": true, "feedback": "Betul, ini kondisi mendesak yang berkaitan dengan kebutuhan pokok." },
          { "id": "o2", "label": "Tunda dulu, naik ojek online seminggu ke depan", "correct": false, "feedback": "Kalau motor kendaraan utama ke kerja, ini termasuk kondisi mendesak yang wajar pakai dana darurat." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Ada flash sale gadget yang sudah lama diincar, diskon 50% cuma hari ini.",
        "options": [
          { "id": "o1", "label": "Pakai dana darurat supaya tidak lewatkan diskon", "correct": false, "feedback": "Ini keinginan, bukan kondisi darurat — dana darurat sebaiknya tidak dipakai untuk ini." },
          { "id": "o2", "label": "Simpan dulu, evaluasi dari anggaran hiburan/gaya hidup", "correct": true, "feedback": "Betul, dana darurat khusus kondisi mendesak, bukan buat promo." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Anak mendadak demam tinggi dan perlu ke dokter malam ini.",
        "options": [
          { "id": "o1", "label": "Pakai dana darurat karena kesehatan keluarga itu prioritas mendesak", "correct": true, "feedback": "Tepat, ini jelas kondisi darurat yang layak pakai dana darurat." },
          { "id": "o2", "label": "Tunggu sampai gajian berikutnya", "correct": false, "feedback": "Kesehatan mendadak tidak bisa ditunda — ini justru contoh tepat penggunaan dana darurat." }
        ]
      }
    ],
    "badge": { "code": "sigap-dana-darurat", "title": "Sigap Dana Darurat" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 8 — Bangun Benteng Darurat (simulation) · Edisi 4: Dana Darurat
-- Melatih prinsip "pengumpulan bertahap" dan "dibangun kembali setelah
-- dipakai" dari Edisi 4.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q008',
  'Bangun Benteng Darurat',
  'Ambil keputusan membangun dana darurat tahap demi tahap',
  'simulation',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Ambil keputusan tiap tahap untuk membangun dana darurat yang kuat.",
    "steps": [
      {
        "id": "st1",
        "label": "Awal bulan, kamu baru mulai menyisihkan dana darurat. Apa langkah pertamamu?",
        "options": [
          { "id": "op1", "label": "Sisihkan nominal kecil tapi rutin tiap gajian", "impact": 1 },
          { "id": "op2", "label": "Tunggu sampai ada uang lebih baru mulai menabung", "impact": 0.2 }
        ]
      },
      {
        "id": "st2",
        "label": "Dana darurat kepakai buat servis motor mendadak. Apa langkah selanjutnya?",
        "options": [
          { "id": "op1", "label": "Mulai bangun lagi dari awal secara bertahap", "impact": 1 },
          { "id": "op2", "label": "Biarkan saja, pikirkan nanti kalau butuh lagi", "impact": 0.1 }
        ]
      }
    ],
    "badge": { "code": "benteng-darurat", "title": "Benteng Darurat" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C03, urut sequential
-- (order_index diberi celah 10 supaya gampang menyisipkan quest baru nanti,
-- lihat docs/petunjuk-teknis.md §"Urutan order_index tidak wajib berurutan rapat")
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values ('Q005', 10), ('Q006', 20), ('Q007', 30), ('Q008', 40)) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C03'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
