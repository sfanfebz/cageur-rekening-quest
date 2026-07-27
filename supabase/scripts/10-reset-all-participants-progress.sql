-- =============================================================================
-- RESET MASSAL: Hapus progres SEMUA peserta di SEMUA campaign
-- Dipakai panel admin (/admin, tombol "Reset Progress Semua Pemain"). Semua
-- peserta akan mulai dari nol lagi begitu membuka Game Hub -- baris progres
-- akan dibuat ulang otomatis oleh aplikasi (tidak perlu insert manual). Data
-- identitas peserta (nama/NIP di tabel participants) TIDAK dihapus.
--
-- TIDAK ADA yang perlu diisi manual -- operasi ini menyapu bersih SEMUA
-- baris tanpa filter, jadi PASTIKAN kamu benar-benar ingin mereset SEMUA
-- pemain sebelum menjalankan (lihat catatan Point-in-Time Recovery di
-- docs/petunjuk-teknis.md §5 untuk operasi berisiko seperti ini).
-- =============================================================================

with del_quest as (
  delete from participant_quest_progress
  returning id
),
del_campaign as (
  delete from participant_campaign_progress
  returning id
)
select
  (select count(*) from del_quest)    as jumlah_quest_progress_dihapus,
  (select count(*) from del_campaign) as jumlah_campaign_progress_dihapus;
