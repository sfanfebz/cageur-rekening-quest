-- =============================================================================
-- Cageur Rekening Quest — seed campaign "Investasi Cerdas & Anti Penipuan Digital"
-- Mengcover Edisi 7 (Investasi Dasar) dan Edisi 8 (Waspada Penipuan
-- Digital) dari docs/Handoff_Materi_Cageur_Rekening_Edisi_1-16.md.
--
-- Jalankan setelah supabase/schema.sql (dan idealnya setelah seed.sql +
-- seed campaign lain kalau mau semuanya ada sebagai riwayat). Aman
-- dijalankan ulang (upsert lewat ON CONFLICT).
--
-- Kedua edisi punya kedalaman setara (7 "Konsep Penting" masing-masing) --
-- dibagi rata 3 quest per edisi, total 6 quest. Tipe mekanik dipilih
-- beda-beda dalam satu campaign ini (tidak ada yang berulang):
-- tap_select, match_pairs, scenario_choice (Edisi 7) + quick_reaction,
-- hidden_object, swipe_cards (Edisi 8).
--
-- Campaign ini dibuat berstatus 'draft' -- aman, belum terlihat pemain
-- sama sekali. Aktifkan lewat supabase/scripts/04-update-campaign-status.sql
-- Skenario B kalau sudah siap tayang.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C05',
  'Cageur Rekening Quest — Investasi Cerdas & Anti Penipuan Digital',
  'Latihan memahami dasar investasi yang sesuai kebutuhan dan risiko, sekaligus mengenali modus penipuan digital sebelum kejadian.',
  'draft',
  null
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Quest 19 — Tanda Investasi yang Aman Dicoba (tap_select) · Edisi 7: Investasi Dasar
-- "Kenali profil risiko, pahami produk, jangan korbankan dana darurat,
-- waspadai janji untung pasti."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q019',
  'Tanda Investasi yang Aman Dicoba',
  'Tap semua tanda investasi yang aman untuk dicoba',
  'tap_select',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap semua tanda investasi yang aman untuk dicoba.",
    "cards": [
      { "id": "c1", "label": "Sesuai profil risiko dan kemampuanmu", "healthy": true, "emoji": "🎯" },
      { "id": "c2", "label": "Sudah paham produk & risikonya sebelum beli", "healthy": true, "emoji": "📖" },
      { "id": "c3", "label": "Dana darurat & kebutuhan pokok tetap aman", "healthy": true, "emoji": "🛡️" },
      { "id": "c4", "label": "Terdaftar dan diawasi OJK", "healthy": true, "emoji": "✅" },
      { "id": "c5", "label": "Janji untung pasti tiap bulan, tanpa risiko", "healthy": false, "emoji": "🚩" },
      { "id": "c6", "label": "Ajakan buru-buru ikut sebelum kehabisan slot", "healthy": false, "emoji": "⏰" },
      { "id": "c7", "label": "Pakai dana darurat/kebutuhan pokok buat modal", "healthy": false, "emoji": "🕳️" }
    ],
    "badge": { "code": "investor-cageur", "title": "Investor Cageur" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 20 — Jodoh Tujuan & Jenis Investasi (match_pairs) · Edisi 7: Investasi Dasar
-- "Pahami produk sebelum membeli" + "diversifikasi dapat membantu
-- mengelola risiko" -- cocokkan tujuan dengan instrumen yang sesuai.
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q020',
  'Jodoh Tujuan & Jenis Investasi',
  'Cocokkan tujuan investasi dengan jenis instrumen yang sesuai',
  'match_pairs',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Jodohkan tujuan investasi dengan jenis instrumen yang paling sesuai.",
    "pairs": [
      { "id": "p1", "left": "Dana liburan 6 bulan lagi", "right": "Deposito/Reksadana Pasar Uang (risiko rendah, jangka pendek)", "emoji": "✈️" },
      { "id": "p2", "left": "Dana pendidikan anak 10 tahun lagi", "right": "Reksadana Saham/Saham (jangka panjang, risiko lebih tinggi)", "emoji": "🎓" },
      { "id": "p3", "left": "Dana pensiun 20 tahun lagi", "right": "Campuran saham & obligasi (jangka sangat panjang)", "emoji": "🌅" },
      { "id": "p4", "left": "Lindung nilai dari inflasi jangka panjang", "right": "Emas/logam mulia", "emoji": "🪙" }
    ],
    "badge": { "code": "jodoh-investasi", "title": "Paham Jodoh Investasi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 21 — Sebelum Mulai Investasi (scenario_choice) · Edisi 7: Investasi Dasar
-- "Waspadai janji keuntungan pasti" + "dana darurat tidak sebaiknya
-- dikorbankan" + "pahami produk sebelum membeli."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q021',
  'Sebelum Mulai Investasi',
  'Pilih respons paling tepat sebelum mulai berinvestasi',
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
        "prompt": "Temanmu ajak ikut investasi yang katanya untung 20% tiap bulan, pasti, tanpa risiko.",
        "options": [
          { "id": "o1", "label": "Waspada, itu ciri khas investasi bodong", "correct": true, "feedback": "Betul, imbal hasil tinggi selalu disertai risiko -- janji \"pasti untung\" itu red flag." },
          { "id": "o2", "label": "Ikut saja, siapa tahu rezeki", "correct": false, "feedback": "Janji untung pasti tanpa risiko itu justru tanda paling umum investasi bodong." }
        ]
      },
      {
        "id": "sc2",
        "prompt": "Kamu belum punya dana darurat sama sekali, tapi tertarik mulai investasi saham.",
        "options": [
          { "id": "o1", "label": "Selesaikan dulu dana darurat, investasi bisa menyusul", "correct": true, "feedback": "Betul, dana darurat & kebutuhan pokok sebaiknya tidak dikorbankan buat investasi." },
          { "id": "o2", "label": "Langsung investasi saja, dana darurat nanti-nanti", "correct": false, "feedback": "Dana darurat itu fondasi -- lebih aman diutamakan sebelum mulai investasi." }
        ]
      },
      {
        "id": "sc3",
        "prompt": "Ada produk investasi yang belum kamu pahami betul cara kerjanya, tapi tergiur returnnya.",
        "options": [
          { "id": "o1", "label": "Pelajari dulu sampai paham sebelum beli", "correct": true, "feedback": "Tepat, pahami produk dulu sebelum membeli itu prinsip penting investasi." },
          { "id": "o2", "label": "Beli saja dulu, dipelajari sambil jalan", "correct": false, "feedback": "Investasi tanpa paham produknya berisiko -- pelajari dulu sebelum memutuskan." }
        ]
      }
    ],
    "badge": { "code": "siap-investasi", "title": "Siap Investasi" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 22 — Radar Modus Penipuan Digital (quick_reaction) · Edisi 8: Waspada Penipuan Digital
-- "Jangan bagikan OTP/PIN" + "waspadai tautan mencurigakan" + "jangan
-- terburu-buru karena ancaman/iming-iming."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q022',
  'Radar Modus Penipuan Digital',
  'Tap cepat tanda modus penipuan, tahan yang sudah aman',
  'quick_reaction',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Tap secepatnya saat muncul tanda modus penipuan, tahan saat muncul kebiasaan yang sudah aman.",
    "reactionWindowMs": 1200,
    "rounds": [
      { "id": "r1", "label": "Diminta kirim kode OTP oleh \"petugas bank\"", "isTarget": true, "emoji": "🚨" },
      { "id": "r2", "label": "Link menang undian yang tidak pernah diikuti", "isTarget": true, "emoji": "🔗" },
      { "id": "r3", "label": "Ancaman akun diblokir kalau tidak klik sekarang", "isTarget": true, "emoji": "⏰" },
      { "id": "r4", "label": "Verifikasi lewat aplikasi/nomor resmi bank", "isTarget": false, "emoji": "✅" },
      { "id": "r5", "label": "Tidak pernah bagikan OTP/PIN ke siapa pun", "isTarget": false, "emoji": "🔒" }
    ],
    "badge": { "code": "radar-penipuan", "title": "Radar Penipuan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 23 — Cari Ciri Pesan Mencurigakan (hidden_object) · Edisi 8: Waspada Penipuan Digital
-- "Periksa identitas pengirim" + "waspadai tautan dan file mencurigakan."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q023',
  'Cari Ciri Pesan Mencurigakan',
  'Temukan semua ciri pesan mencurigakan dalam waktu terbatas',
  'hidden_object',
  'active',
  25,
  1,
  false,
  '{
    "instruction": "Dalam 30 detik, tap semua ciri pesan yang mencurigakan.",
    "timeLimitSeconds": 30,
    "targets": [
      { "id": "t1", "label": "Minta OTP/PIN/password lewat chat", "emoji": "🔑" },
      { "id": "t2", "label": "Link disingkat yang tidak jelas tujuannya", "emoji": "🔗" },
      { "id": "t3", "label": "Mengaku petugas resmi tapi dari nomor pribadi", "emoji": "🎭" },
      { "id": "t4", "label": "Iming-iming hadiah tanpa pernah ikut undian", "emoji": "🎁" }
    ],
    "decoys": [
      { "id": "d1", "label": "Notifikasi resmi dari aplikasi bank", "emoji": "📱" },
      { "id": "d2", "label": "Struk transaksi normal", "emoji": "🧾" },
      { "id": "d3", "label": "Pesan konfirmasi dari nomor CS terverifikasi", "emoji": "☎️" },
      { "id": "d4", "label": "Info tagihan bulanan rutin", "emoji": "📄" }
    ],
    "badge": { "code": "detektif-penipuan", "title": "Detektif Penipuan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Quest 24 — Pesan Masuk: Aman atau Awas? (swipe_cards) · Edisi 8: Waspada Penipuan Digital
-- "Verifikasi lewat kanal resmi" + "blokir atau laporkan jika ada indikasi
-- penipuan."
-- ---------------------------------------------------------------------------
insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, allow_replay, config_json)
values (
  'Q024',
  'Pesan Masuk: Aman atau Awas?',
  'Swipe tiap pesan ke kategori yang paling tepat',
  'swipe_cards',
  'active',
  20,
  1,
  false,
  '{
    "instruction": "Swipe tiap pesan yang masuk ke kategori yang paling tepat.",
    "directions": { "right": "Aman", "up": "Verifikasi Dulu", "left": "Blokir & Lapor" },
    "items": [
      { "id": "i1", "label": "SMS resmi OTP transaksi yang kamu lakukan sendiri", "best": "Aman", "emoji": "✅" },
      { "id": "i2", "label": "Chat mengaku CS bank minta nomor kartu & OTP", "best": "Blokir & Lapor", "emoji": "🚫" },
      { "id": "i3", "label": "Email promo dari toko langganan yang biasa kamu pakai", "best": "Aman", "emoji": "📧" },
      { "id": "i4", "label": "Link \"menang hadiah\" dari nomor tidak dikenal", "best": "Blokir & Lapor", "emoji": "🎁" },
      { "id": "i5", "label": "Telepon mengaku pihak bank, minta transfer verifikasi", "best": "Verifikasi Dulu", "emoji": "☎️" },
      { "id": "i6", "label": "Pesan investasi untung pasti dari grup tidak dikenal", "best": "Blokir & Lapor", "emoji": "📉" }
    ],
    "badge": { "code": "sigap-pesan", "title": "Sigap Pesan" }
  }'::jsonb
)
on conflict (quest_code) do update set
  title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type,
  status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

-- ---------------------------------------------------------------------------
-- Hubungkan quest ke campaign CR-C05, urut sequential
-- ---------------------------------------------------------------------------
insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c
cross join (values
  ('Q019', 10), ('Q020', 20), ('Q021', 30), ('Q022', 40), ('Q023', 50), ('Q024', 60)
) as data(quest_code, order_index)
join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C05'
on conflict (campaign_id, quest_id) do update set
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  unlock_rule = excluded.unlock_rule;
