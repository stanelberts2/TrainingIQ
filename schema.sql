-- TrainIQ MVP schema
-- Run this in the Supabase SQL editor for the first cloud-backed version.
-- The current app can still run locally with localStorage; this schema prepares
-- the same workout model for authenticated sync across laptop and phone.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  hyrox_division text not null default '',
  age_group text not null default '',
  unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles
  add column if not exists hyrox_division text not null default '',
  add column if not exists age_group text not null default '',
  add column if not exists unit_system text not null default 'metric'
    check (unit_system in ('metric', 'imperial'));

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('manual', 'google_sheets', 'strava', 'garmin', 'intervals_icu')),
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
  quality_duration_seconds numeric not null default 0,
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
  add column if not exists quality_volume_meters numeric not null default 0,
  add column if not exists quality_duration_seconds numeric not null default 0;

create table if not exists workout_laps (
  id uuid primary key default gen_random_uuid(),
  workout_id text not null references workouts(id) on delete cascade,
  lap_index integer not null,
  name text not null default '',
  exercise_type text not null default '' check (
    exercise_type in ('', 'run', 'ski_erg', 'row_erg', 'bike_erg', 'strength', 'rest', 'transition', 'other')
  ),
  lap_role text not null default 'work' check (lap_role in ('work', 'recovery', 'warmup', 'cooldown', 'transition', 'unknown')),
  effort_goal text not null default '' check (
    effort_goal in ('', 'z1', 'z2', 'z3', 'threshold', 'vo2max', 'all_out', 'race_pace', 'recovery', 'technique', 'other')
  ),
  start_offset_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  distance_meters numeric not null default 0,
  avg_hr integer not null default 0,
  max_hr integer not null default 0,
  avg_pace text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  unique (workout_id, lap_index)
);

alter table workout_laps
  add column if not exists exercise_type text not null default ''
    check (exercise_type in ('', 'run', 'ski_erg', 'row_erg', 'bike_erg', 'strength', 'rest', 'transition', 'other')),
  add column if not exists lap_role text not null default 'work'
    check (lap_role in ('work', 'recovery', 'warmup', 'cooldown', 'transition', 'unknown')),
  add column if not exists effort_goal text not null default ''
    check (effort_goal in ('', 'z1', 'z2', 'z3', 'threshold', 'vo2max', 'all_out', 'race_pace', 'recovery', 'technique', 'other'));

create table if not exists workout_segments (
  id uuid primary key default gen_random_uuid(),
  workout_id text not null references workouts(id) on delete cascade,
  segment_index integer not null,
  segment_type text not null default 'other' check (
    segment_type in (
      'run',
      'ski_erg',
      'row_erg',
      'sled_push',
      'sled_pull',
      'burpee_broad_jump',
      'sandbag_lunge',
      'farmer_carry',
      'wall_ball',
      'strength',
      'rest',
      'transition',
      'other'
    )
  ),
  name text not null default '',
  start_offset_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  distance_meters numeric not null default 0,
  sets integer not null default 0,
  reps integer not null default 0,
  weight_kg numeric not null default 0,
  avg_hr integer not null default 0,
  max_hr integer not null default 0,
  avg_pace text not null default '',
  avg_watts numeric not null default 0,
  rpe numeric not null default 0 check (rpe >= 0 and rpe <= 10),
  load numeric not null default 0,
  notes text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  unique (workout_id, segment_index)
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

create table if not exists activity_streams (
  id uuid primary key default gen_random_uuid(),
  workout_id text not null references workouts(id) on delete cascade,
  stream_type text not null check (
    stream_type in ('time', 'distance', 'latlng', 'heartrate', 'velocity_smooth', 'watts', 'cadence', 'altitude')
  ),
  source text not null default 'strava' check (source in ('strava', 'garmin', 'manual')),
  resolution text not null default 'raw' check (resolution in ('raw', 'downsampled', 'summary')),
  data jsonb not null default '[]'::jsonb,
  sample_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (workout_id, stream_type, source, resolution)
);

create table if not exists personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text references workouts(id) on delete set null,
  segment_type text not null default 'other',
  metric_name text not null,
  metric_value numeric not null,
  metric_unit text not null default '',
  achieved_at date not null,
  source text not null default 'manual' check (source in ('manual', 'computed', 'strava', 'garmin')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, segment_type, metric_name, metric_unit)
);

create table if not exists training_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sport text not null default 'hyrox',
  segment_type text not null default 'other',
  metric_name text not null,
  target_value numeric not null,
  target_unit text not null default '',
  baseline_value numeric,
  due_date date,
  status text not null default 'active' check (status in ('active', 'achieved', 'paused', 'archived')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workouts_user_date_idx on workouts (user_id, date desc);
create index if not exists workouts_user_type_idx on workouts (user_id, sport, workout_type, date desc);
create index if not exists workouts_interval_family_idx on workouts (user_id, sport, workout_type, interval_family, date desc);
create index if not exists workouts_source_external_idx on workouts (source, external_id);
create index if not exists workout_laps_workout_idx on workout_laps (workout_id, lap_index);
create index if not exists workout_laps_exercise_type_idx on workout_laps (exercise_type, workout_id);
create index if not exists workout_laps_effort_goal_idx on workout_laps (effort_goal, workout_id);
create index if not exists workout_segments_workout_idx on workout_segments (workout_id, segment_index);
create index if not exists workout_segments_type_idx on workout_segments (segment_type, workout_id);
create index if not exists detected_intervals_workout_idx on detected_intervals (workout_id, interval_index);
create index if not exists activity_streams_workout_idx on activity_streams (workout_id, stream_type);
create index if not exists personal_records_user_metric_idx on personal_records (user_id, segment_type, metric_name);
create index if not exists training_goals_user_status_idx on training_goals (user_id, status, due_date);

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

drop trigger if exists personal_records_set_updated_at on personal_records;
create trigger personal_records_set_updated_at
  before update on personal_records
  for each row execute function set_updated_at();

drop trigger if exists training_goals_set_updated_at on training_goals;
create trigger training_goals_set_updated_at
  before update on training_goals
  for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table data_sources enable row level security;
alter table workouts enable row level security;
alter table workout_laps enable row level security;
alter table workout_segments enable row level security;
alter table detected_intervals enable row level security;
alter table activity_streams enable row level security;
alter table personal_records enable row level security;
alter table training_goals enable row level security;

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

drop policy if exists "workout_segments_own_all" on workout_segments;
create policy "workout_segments_own_all"
  on workout_segments for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_segments.workout_id
        and workouts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts
      where workouts.id = workout_segments.workout_id
        and workouts.user_id = auth.uid()
    )
  );

drop policy if exists "activity_streams_own_all" on activity_streams;
create policy "activity_streams_own_all"
  on activity_streams for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = activity_streams.workout_id
        and workouts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts
      where workouts.id = activity_streams.workout_id
        and workouts.user_id = auth.uid()
    )
  );

drop policy if exists "personal_records_own_all" on personal_records;
create policy "personal_records_own_all"
  on personal_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "training_goals_own_all" on training_goals;
create policy "training_goals_own_all"
  on training_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Strava sync foundation.
alter table data_sources
  add column if not exists provider_scope text not null default '',
  add column if not exists provider_profile jsonb not null default '{}'::jsonb,
  add column if not exists sync_status text not null default 'idle'
    check (sync_status in ('idle', 'connected', 'syncing', 'error', 'revoked')),
  add column if not exists last_error text not null default '',
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create index if not exists data_sources_provider_external_idx
  on data_sources (provider, external_account_id);

create table if not exists oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('strava')),
  state text not null unique,
  redirect_to text not null default '',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_states_user_provider_idx
  on oauth_states (user_id, provider, created_at desc);

create table if not exists strava_webhook_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_id text not null,
  object_id text not null,
  object_type text not null,
  aspect_type text not null,
  event_time timestamptz not null,
  subscription_id text not null default '',
  updates jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  processing_error text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists strava_webhook_events_user_created_idx
  on strava_webhook_events (user_id, created_at desc);

create index if not exists strava_webhook_events_object_idx
  on strava_webhook_events (owner_id, object_type, object_id, aspect_type);

create unique index if not exists strava_webhook_events_dedupe_idx
  on strava_webhook_events (owner_id, object_type, object_id, aspect_type, event_time);

create table if not exists strava_import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null,
  status text not null default 'queued'
    check (status in ('queued', 'imported', 'skipped', 'error')),
  message text not null default '',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists strava_import_logs_user_activity_idx
  on strava_import_logs (user_id, activity_id, created_at desc);

alter table oauth_states enable row level security;
alter table strava_webhook_events enable row level security;
alter table strava_import_logs enable row level security;

drop policy if exists "oauth_states_own_all" on oauth_states;
create policy "oauth_states_own_all"
  on oauth_states for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "strava_webhook_events_select_own" on strava_webhook_events;
create policy "strava_webhook_events_select_own"
  on strava_webhook_events for select
  using (auth.uid() = user_id);

drop policy if exists "strava_import_logs_select_own" on strava_import_logs;
create policy "strava_import_logs_select_own"
  on strava_import_logs for select
  using (auth.uid() = user_id);

-- Sync preference foundation for later daily automation.
alter table data_sources
  drop constraint if exists data_sources_provider_check;

alter table data_sources
  add constraint data_sources_provider_check
  check (provider in ('manual', 'google_sheets', 'strava', 'garmin', 'intervals_icu'));

create table if not exists sync_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  strava_enabled boolean not null default true,
  intervals_icu_enabled boolean not null default true,
  daily_sync_enabled boolean not null default false,
  sync_window_days integer not null default 30 check (sync_window_days between 1 and 365),
  last_manual_sync_at timestamptz,
  last_automatic_sync_at timestamptz,
  last_error text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sync_preferences enable row level security;

drop policy if exists "sync_preferences_own_all" on sync_preferences;
create policy "sync_preferences_own_all"
  on sync_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists sync_preferences_set_updated_at on sync_preferences;
create trigger sync_preferences_set_updated_at
  before update on sync_preferences
  for each row execute function set_updated_at();
