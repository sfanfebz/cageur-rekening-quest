-- =============================================================================
-- RESET: Hapus progres 1 peserta spesifik untuk 1 campaign spesifik
-- Peserta bisa lanjut main dari awal lagi di campaign yang direset -- baris
-- progress akan dibuat ulang otomatis oleh aplikasi begitu mereka membuka
-- Game Hub lagi (tidak perlu insert manual).
--
-- ISI MANUAL (baris bertanda 👉), semua ada di dalam CTE "target" paling
-- atas -- cukup diisi SEKALI, dipakai untuk kedua penghapusan:
--   - nip            : NIP peserta yang mau direset.
--   - normalized_name: HANYA perlu diisi kalau NIP peserta itu '00000'
--                       (non-organik/swakelola) -- banyak orang bisa berbagi
--                       NIP 00000, jadi nama dipakai untuk membedakan. Isi
--                       dengan huruf kecil semua (mis. 'budi santoso').
--                       Kalau NIP bukan '00000', baris ini diabaikan otomatis.
--   - campaign_code  : campaign mana yang progresnya mau direset.
--
-- Catatan soal RETURNING: karena ini operasi hapus (bukan tambah data), yang
-- ditampilkan di akhir adalah RINGKASAN jumlah baris yang terhapus, bukan
-- record baru. Kalau participant_id/campaign_id di bawah salah ketik/tidak
-- ketemu, kedua angka akan tampil 0 (aman, tidak menghapus apa pun).
-- =============================================================================

with target as (
  select
    (
      select id from participants
      where nip = '123456'                                   -- 👉 NIP peserta
        and (nip <> '00000' or normalized_name = 'nama peserta') -- 👉 isi HANYA kalau NIP = 00000
      limit 1
    ) as participant_id,
    (
      select id from campaigns where campaign_code = 'CR-C01' -- 👉 kode campaign yang direset
      limit 1
    ) as campaign_id
),
del_quest as (
  delete from participant_quest_progress pqp
  using target t
  where pqp.participant_id = t.participant_id
    and pqp.campaign_id = t.campaign_id
  returning pqp.id
),
del_campaign as (
  delete from participant_campaign_progress pcp
  using target t
  where pcp.participant_id = t.participant_id
    and pcp.campaign_id = t.campaign_id
  returning pcp.id
)
select
  (select participant_id from target)               as participant_id,
  (select campaign_id from target)                   as campaign_id,
  (select count(*) from del_quest)                   as jumlah_quest_progress_dihapus,
  (select count(*) from del_campaign)                as jumlah_campaign_progress_dihapus;
