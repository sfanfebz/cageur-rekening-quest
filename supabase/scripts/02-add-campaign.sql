-- =============================================================================
-- INSERT: Tambah campaign baru
-- Aman dijalankan ulang (upsert lewat ON CONFLICT campaign_code) -- kalau
-- kode campaign sudah ada, baris ini akan MEMPERBARUI campaign yang sudah
-- ada, bukan bikin duplikat.
--
-- ISI MANUAL (baris bertanda 👉):
--   - campaign_code : kode unik pendek, mis. 'CR-C03' (huruf besar, tanpa spasi)
--   - title         : judul yang tampil di Game Hub
--   - description   : deskripsi singkat (boleh NULL)
--   - status        : salah satu dari 'draft' | 'upcoming' | 'active' | 'archived' | 'disabled'
--   - start_at      : kapan campaign mulai (NULL kalau belum ditentukan)
--
-- ⚠️ CATATAN: hanya boleh ada SATU campaign berstatus 'active' pada satu
-- waktu (dijaga unique index di schema.sql). Kalau langsung isi status
-- 'active' di sini padahal masih ada campaign aktif lain, insert ini akan
-- GAGAL dengan error "duplicate key value violates unique constraint". Isi
-- status 'draft' atau 'upcoming' dulu di sini, lalu aktifkan belakangan
-- lewat 04-update-campaign-status.sql (skenario B) yang otomatis
-- mengarsipkan campaign aktif yang lama.
-- =============================================================================

insert into campaigns (campaign_code, title, description, status, start_at)
values (
  'CR-C03',                              -- 👉 kode campaign
  'Nama Campaign Baru',                  -- 👉 judul
  'Deskripsi singkat campaign ini.',     -- 👉 deskripsi (boleh null)
  'draft',                               -- 👉 status awal
  null                                   -- 👉 start_at, mis. now() atau '2026-08-01 00:00:00+07'
)
on conflict (campaign_code) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  start_at = excluded.start_at
returning *;
