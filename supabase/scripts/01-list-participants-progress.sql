-- =============================================================================
-- QUERY: Daftar peserta terdaftar beserta progres campaign & jumlah badge
-- Read-only (SELECT saja) -- aman dijalankan kapan pun, tidak mengubah data.
--
-- ISI MANUAL (baris bertanda 👉):
--   - campaign_code di klausa WHERE paling bawah: ganti sesuai campaign yang
--     mau dilihat, atau HAPUS baris WHERE itu untuk melihat SEMUA campaign
--     sekaligus (setiap peserta akan muncul satu baris per campaign).
-- =============================================================================

select
  p.full_name                                   as nama,
  p.nip,
  c.campaign_code,
  c.title                                       as campaign,
  coalesce(pcp.status, 'belum_mulai')           as status_progres,
  coalesce(pcp.completed_quest_count, 0)        as quest_selesai,
  (
    select count(*) from campaign_quests cq
    where cq.campaign_id = c.id and cq.is_required
  )                                              as total_quest_wajib,
  coalesce(pcp.total_score, 0)                  as total_skor,
  coalesce(pcp.max_score, 0)                    as skor_maksimal,
  (
    select count(*) from participant_quest_progress pqp
    join quests q on q.id = pqp.quest_id
    where pqp.participant_id = p.id
      and pqp.campaign_id = c.id
      and pqp.status = 'completed'
      and jsonb_typeof(q.config_json -> 'badge') = 'object'
  )                                              as jumlah_badge,
  pcp.started_at,
  pcp.completed_at,
  p.created_at                                  as terdaftar_sejak
from participants p
cross join campaigns c
left join participant_campaign_progress pcp
  on pcp.participant_id = p.id and pcp.campaign_id = c.id
where c.campaign_code = 'CR-C01' -- 👉 GANTI kode campaign, atau hapus baris ini untuk semua campaign
order by total_skor desc nulls last, p.full_name asc;
