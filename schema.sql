-- TrainIQ MVP schema
-- Run this in the Supabase SQL editor for the first cloud-backed version.
-- The current app can still run locally with localStorage; this schema prepares
-- the same workout model for authenticated sync across laptop and phone.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('manual', 'google_sheets', 'strava', 'garmin')),
  external_account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists workouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'google_sheets', 'strava', 'garmin')),
  external_id text,
  date date not null,
  start_time time,
  sport text not null check (sport in ('running', 'hyrox', 'strength', 'cycling')),
  title text not null,
  workout_type text not null default 'general',
  duration_min numeric not null default 0,
  distance_km numeric not null default 0,
  avg_hr integer not null default 0,
  max_hr integer not null default 0,
  load numeric not null default 0,
  avg_pace text not null default '',
  elevation_gain numeric not null default 0,
  interval_family text not null default '',
  rep_distance_meters numeric not null default 0,
  rep_duration_seconds numeric not null default 0,
  rep_count integer not null default 0,
  quality_volume_meters numeric not null default 0,
  notes text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

alter table workouts
  add column if not exists interval_family text not null default '',
  add column if not exists rep_distance_meters numeric not null default 0,
  add column if not exists rep_duration_seconds numeric not null default 0,
  add column if not exists rep_count integer not null default 0,
  add column if not exists quality_volume_meters numeric not null default 0;

create table if not exists workout_laps (
  id uuid primary key default gen_random_uuid(),
  workout_id text not null references workouts(id) on delete cascade,
  lap_index integer not null,
  name text not null default '',
  start_offset_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  distance_meters numeric not null default 0,
  avg_hr integer not null default 0,
  max_hr integer not null default 0,
  avg_pace text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  unique (workout_id, lap_index)
);

create table if not exists detected_intervals (
  id uuid primary key default gen_random_uuid(),
  workout_id text not null references workouts(id) on delete cascade,
  interval_index integer not null,
  source text not null default 'trainiq' check (source in ('strava_laps', 'streams', 'trainiq')),
  label text not null default '',
  start_offset_seconds numeric not null default 0,
  end_offset_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  distance_meters numeric not null default 0,
  avg_hr integer not null default 0,
  max_hr integer not null default 0,
  avg_pace text not null default '',
  confidence numeric not null default 0,
  notes text not null default '',
  unique (workout_id, interval_index)
);

alter table detected_intervals
  add column if not exists max_hr integer not null default 0;

create index if not exists workouts_user_date_idx on workouts (user_id, date desc);
create index if not exists workouts_user_type_idx on workouts (user_id, sport, workout_type, date desc);
create index if not exists workouts_interval_family_idx on workouts (user_id, sport, workout_type, interval_family, date desc);
create index if not exists workouts_source_external_idx on workouts (source, external_id);
create index if not exists workout_laps_workout_idx on workout_laps (workout_id, lap_index);
create index if not exists detected_intervals_workout_idx on detected_intervals (workout_id, interval_index);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists data_sources_set_updated_at on data_sources;
create trigger data_sources_set_updated_at
  before update on data_sources
  for each row execute function set_updated_at();

drop trigger if exists workouts_set_updated_at on workouts;
create trigger workouts_set_updated_at
  before update on workouts
  for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table data_sources enable row level security;
alter table workouts enable row level security;
alter table workout_laps enable row level security;
alter table detected_intervals enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "data_sources_own_all" on data_sources;
create policy "data_sources_own_all"
  on data_sources for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workouts_own_all" on workouts;
create policy "workouts_own_all"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workout_laps_own_all" on workout_laps;
create policy "workout_laps_own_all"
  on workout_laps for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_laps.workout_id
        and workouts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts
      where workouts.id = workout_laps.workout_id
        and workouts.user_id = auth.uid()
    )
  );

drop policy if exists "detected_intervals_own_all" on detected_intervals;
create policy "detected_intervals_own_all"
  on detected_intervals for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = detected_intervals.workout_id
        and workouts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts
      where workouts.id = detected_intervals.workout_id
        and workouts.user_id = auth.uid()
    )
  );
