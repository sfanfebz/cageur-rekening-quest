-- Cageur Rekening Quest — schema Supabase (PostgreSQL)
-- Jalankan di Supabase SQL Editor. Aman dijalankan berulang kali (idempotent).
--
-- Prinsip keamanan: Row Level Security diaktifkan dengan DEFAULT DENY pada
-- semua tabel dan TIDAK ADA policy yang dibuat untuk role `anon` / `authenticated`.
-- Hanya kode server (Route Handler & Server Component) yang membaca/menulis,
-- memakai SUPABASE_SERVICE_ROLE_KEY yang otomatis melewati RLS. Browser tidak
-- pernah memegang service key, jadi tanpa policy publik pun aplikasi tetap jalan.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_name text not null,
  nip text not null,
  unique_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists participants_unique_key_key on participants (unique_key);

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_code text not null,
  title text not null,
  description text,
  status text not null check (status in ('draft', 'upcoming', 'active', 'archived', 'disabled')),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists campaigns_campaign_code_key on campaigns (campaign_code);
create index if not exists campaigns_status_idx on campaigns (status);

-- Hanya satu campaign `active` yang diperbolehkan pada satu waktu.
create unique index if not exists campaigns_single_active_idx
  on campaigns ((true))
  where status = 'active';

-- ---------------------------------------------------------------------------
-- quests
-- ---------------------------------------------------------------------------
create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  quest_code text not null,
  title text not null,
  subtitle text,
  quest_type text not null,
  status text not null check (status in ('draft', 'upcoming', 'active', 'archived', 'disabled')),
  max_score integer not null check (max_score >= 0),
  version integer not null default 1,
  allow_replay boolean not null default false,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists quests_quest_code_key on quests (quest_code);
create index if not exists quests_status_idx on quests (status);
create index if not exists quests_quest_type_idx on quests (quest_type);

-- ---------------------------------------------------------------------------
-- campaign_quests (menghubungkan quest ke campaign + aturan unlock)
-- ---------------------------------------------------------------------------
create table if not exists campaign_quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  quest_id uuid not null references quests (id) on delete cascade,
  order_index integer not null default 1,
  is_required boolean not null default true,
  unlock_rule text not null default 'sequential' check (unlock_rule in ('independent', 'sequential', 'prerequisite', 'scheduled')),
  prerequisite_quest_ids uuid[] not null default '{}',
  available_from timestamptz,
  available_until timestamptz
);

create unique index if not exists campaign_quests_campaign_quest_key on campaign_quests (campaign_id, quest_id);
create index if not exists campaign_quests_campaign_idx on campaign_quests (campaign_id, order_index);

-- ---------------------------------------------------------------------------
-- participant_campaign_progress
-- ---------------------------------------------------------------------------
create table if not exists participant_campaign_progress (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'started', 'completed')),
  completed_quest_count integer not null default 0,
  total_score integer not null default 0,
  max_score integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists participant_campaign_progress_key
  on participant_campaign_progress (participant_id, campaign_id);
create index if not exists participant_campaign_progress_campaign_idx
  on participant_campaign_progress (campaign_id, status);
-- Menopang pengurutan leaderboard: skor tertinggi dulu, lalu selesai lebih awal.
create index if not exists participant_campaign_progress_leaderboard_idx
  on participant_campaign_progress (campaign_id, total_score desc, completed_at asc);

-- ---------------------------------------------------------------------------
-- participant_quest_progress
-- ---------------------------------------------------------------------------
create table if not exists participant_quest_progress (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  quest_id uuid not null references quests (id) on delete cascade,
  quest_version integer not null default 1,
  status text not null default 'available' check (status in ('locked', 'available', 'started', 'completed')),
  score integer,
  max_score integer,
  answer_data_json jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists participant_quest_progress_key
  on participant_quest_progress (participant_id, campaign_id, quest_id, quest_version);
create index if not exists participant_quest_progress_participant_idx
  on participant_quest_progress (participant_id, campaign_id);

-- ---------------------------------------------------------------------------
-- updated_at otomatis
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_participants_updated_at on participants;
create trigger trg_participants_updated_at before update on participants
  for each row execute function set_updated_at();

drop trigger if exists trg_campaigns_updated_at on campaigns;
create trigger trg_campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();

drop trigger if exists trg_quests_updated_at on quests;
create trigger trg_quests_updated_at before update on quests
  for each row execute function set_updated_at();

drop trigger if exists trg_pcp_updated_at on participant_campaign_progress;
create trigger trg_pcp_updated_at before update on participant_campaign_progress
  for each row execute function set_updated_at();

drop trigger if exists trg_pqp_updated_at on participant_quest_progress;
create trigger trg_pqp_updated_at before update on participant_quest_progress
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — default deny, tanpa policy publik
-- ---------------------------------------------------------------------------
alter table participants enable row level security;
alter table campaigns enable row level security;
alter table quests enable row level security;
alter table campaign_quests enable row level security;
alter table participant_campaign_progress enable row level security;
alter table participant_quest_progress enable row level security;
