-- =============================================================================
-- UPDATE: Ubah status campaign
-- Dua skenario disediakan -- pakai salah satu sesuai kebutuhan, hapus yang
-- tidak dipakai sebelum menjalankan.
--
-- ISI MANUAL (baris bertanda 👉): ganti campaign_code & status target.
-- =============================================================================

-- -----------------------------------------------------------------------
-- SKENARIO A -- ubah status BIASA (bukan mengaktifkan campaign)
-- Cocok untuk: draft -> upcoming, active -> archived, apa saja -> disabled, dst.
-- -----------------------------------------------------------------------
update campaigns
set status = 'archived'              -- 👉 status baru: draft|upcoming|active|archived|disabled
where campaign_code = 'CR-C01'       -- 👉 kode campaign yang diubah
returning *;

-- -----------------------------------------------------------------------
-- SKENARIO B -- AKTIFKAN campaign baru (otomatis arsipkan campaign aktif lama)
-- Hanya boleh ada 1 campaign berstatus 'active' dalam satu waktu (dijaga
-- unique index di schema.sql) -- kalau langsung UPDATE ... SET
-- status='active' padahal masih ada campaign lain yang aktif, akan GAGAL
-- dengan error "duplicate key". Skrip di bawah menangani itu dalam satu
-- transaksi: arsipkan yang lama, baru aktifkan yang baru.
-- -----------------------------------------------------------------------
begin;

update campaigns
set status = 'archived'
where status = 'active'
  and campaign_code <> 'CR-C02';    -- 👉 kode campaign yang MAU DIAKTIFKAN (dikecualikan dari pengarsipan)

update campaigns
set status = 'active'
where campaign_code = 'CR-C02'      -- 👉 samakan dengan baris di atas
returning *;

commit;
