-- =============================================================================
-- QUERY: Daftar quest dalam 1 campaign, lengkap urutan & aturan unlock
-- Read-only -- cek sebelum menambah quest baru (biar tahu order_index yang
-- sudah kepakai) atau sebelum melepas/mengarsipkan quest tertentu
-- (lihat 08-remove-quest-from-campaign.sql).
--
-- ISI MANUAL (baris bertanda 👉): ganti campaign_code.
-- =============================================================================

select
  cq.order_index,
  q.quest_code,
  q.title,
  q.quest_type,
  q.status                                              as status_quest,
  q.max_score,
  cq.is_required,
  cq.unlock_rule,
  cq.prerequisite_quest_ids,
  cq.available_from,
  cq.available_until,
  jsonb_typeof(q.config_json -> 'badge') = 'object'      as punya_badge
from campaign_quests cq
join quests q on q.id = cq.quest_id
join campaigns c on c.id = cq.campaign_id
where c.campaign_code = 'CR-C01'   -- 👉 kode campaign
order by cq.order_index asc;
