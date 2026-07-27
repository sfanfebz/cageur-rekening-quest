-- =============================================================================
-- RESET: Hapus progres 1 peserta di SEMUA campaign yang pernah diikutinya
-- Beda dengan 05-reset-user-progress.sql (yang cuma reset 1 campaign spesifik),
-- script ini menghapus progres peserta itu di SELURUH campaign sekaligus --
-- dipakai panel admin (/admin, tombol "Reset Progress Pemain Tertentu").
-- Data identitas peserta (nama/NIP di tabel participants) TIDAK dihapus,
-- peserta bisa langsung main lagi dari awal begitu membuka Game Hub.
--
-- ISI MANUAL (baris bertanda 👉), semua ada di dalam CTE "target" paling
-- atas -- cukup diisi SEKALI, dipakai untuk kedua penghapusan:
--   - nip            : NIP peserta yang mau direset.
--   - normalized_name: HANYA perlu diisi kalau NIP peserta itu '00000'
--                       (non-organik/swakelola) -- banyak orang bisa berbagi
--                       NIP 00000, jadi nama dipakai untuk membedakan. Isi
--                       dengan huruf kecil semua (mis. 'budi santoso').
--                       Kalau NIP bukan '00000', baris ini diabaikan otomatis.
--
-- Catatan soal RETURNING: karena ini operasi hapus (bukan tambah data), yang
-- ditampilkan di akhir adalah RINGKASAN jumlah baris yang terhapus, bukan
-- record baru. Kalau participant_id di bawah salah ketik/tidak ketemu, kedua
-- angka akan tampil 0 (aman, tidak menghapus apa pun).
-- =============================================================================

with target as (
  select id as participant_id from participants
  where nip = '123456'                                      -- 👉 NIP peserta
    and (nip <> '00000' or normalized_name = 'nama peserta') -- 👉 isi HANYA kalau NIP = 00000
  limit 1
),
del_quest as (
  delete from participant_quest_progress pqp
  using target t
  where pqp.participant_id = t.participant_id
  returning pqp.id
),
del_campaign as (
  delete from participant_campaign_progress pcp
  using target t
  where pcp.participant_id = t.participant_id
  returning pcp.id
)
select
  (select participant_id from target)  as participant_id,
  (select count(*) from del_quest)     as jumlah_quest_progress_dihapus,
  (select count(*) from del_campaign)  as jumlah_campaign_progress_dihapus;
