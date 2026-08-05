-- TrainIQ sync preferences foundation.
-- This stores the intended sync behavior per user without enabling scheduled jobs yet.

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
