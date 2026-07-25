-- =============================================================================
-- QUERY: Klasemen/leaderboard lengkap untuk 1 campaign
-- Read-only -- meniru persis logika ranking yang dipakai aplikasi
-- (lib/data.ts: fetchLeaderboardRows, dipakai fitur "Klasemen Lengkap").
-- Hanya peserta yang SUDAH MENYELESAIKAN campaign (status = 'completed')
-- yang masuk klasemen, diurutkan skor tertinggi dulu lalu selesai lebih awal.
--
-- ISI MANUAL (baris bertanda 👉): ganti campaign_code.
-- =============================================================================

select
  row_number() over (order by pcp.total_score desc, pcp.completed_at asc) as peringkat,
  p.full_name                                                             as nama,
  p.nip,
  pcp.total_score                                                         as skor,
  pcp.max_score                                                           as skor_maksimal,
  pcp.completed_quest_count                                               as quest_selesai,
  pcp.completed_at
from participant_campaign_progress pcp
join participants p on p.id = pcp.participant_id
join campaigns c on c.id = pcp.campaign_id
where c.campaign_code = 'CR-C01'   -- 👉 kode campaign
  and pcp.status = 'completed'
order by pcp.total_score desc, pcp.completed_at asc;
