-- =============================================================================
-- LEPAS/NONAKTIFKAN quest dari campaign, tanpa menghapus quest itu sendiri
-- Dua opsi disediakan -- baca perbedaannya, pakai salah satu.
--
-- ISI MANUAL (baris bertanda 👉): ganti quest_code (dan campaign_code kalau
-- pakai Opsi B).
-- =============================================================================

-- -----------------------------------------------------------------------
-- OPSI A (DIREKOMENDASIKAN) -- arsipkan quest-nya (quests.status = 'archived')
--
-- Ini mekanisme resmi yang sudah dipakai aplikasi (lib/data.ts,
-- getCampaignQuestsWithState): begitu quest berstatus 'archived' --
--   - Peserta yang SUDAH pernah menyelesaikannya: tetap melihat riwayat
--     & skornya seperti biasa (tidak hilang).
--   - Peserta yang BELUM pernah membukanya: quest ini disembunyikan total,
--     tidak bisa dimainkan lagi.
-- Link ke campaign_quests tidak disentuh, jadi order_index & pengaturan
-- lain tetap utuh kalau suatu saat mau diaktifkan kembali (tinggal ganti
-- status ke 'active' lagi).
--
-- ⚠️ Ini mengubah quest secara GLOBAL -- kalau quest yang sama kebetulan
-- dipakai juga di campaign lain, akan ikut terarsip di sana juga.
-- -----------------------------------------------------------------------
update quests
set status = 'archived'
where quest_code = 'Q001'   -- 👉 kode quest yang mau dilepas dari rotasi
returning *;

-- -----------------------------------------------------------------------
-- OPSI B (LEBIH KERAS) -- putus link-nya sepenuhnya dari 1 campaign spesifik
--
-- Quest akan hilang TOTAL dari daftar campaign ini (termasuk dari riwayat
-- peserta yang sudah pernah menyelesaikannya -- skornya tetap tersimpan di
-- participant_quest_progress & tetap terhitung di total_score peserta,
-- tapi baris quest-nya tidak lagi muncul di daftar/riwayat quest campaign
-- ini). Quest itu sendiri (tabel quests) tidak terhapus & masih bisa
-- dipasang lagi ke campaign lain lewat 03-add-quest.sql STEP 3.
--
-- Pakai opsi ini HANYA kalau memang mau memutus keterkaitan quest dari
-- campaign ini sepenuhnya, bukan sekadar menyembunyikannya.
-- -----------------------------------------------------------------------
delete from campaign_quests cq
using quests q, campaigns c
where cq.quest_id = q.id
  and cq.campaign_id = c.id
  and q.quest_code = 'Q001'          -- 👉 kode quest
  and c.campaign_code = 'CR-C01'     -- 👉 kode campaign
returning cq.*;
