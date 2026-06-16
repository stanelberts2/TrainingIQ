-- TrainIQ Strava sync foundation.
-- Run after the base schema and HYROX migrations.

create extension if not exists pgcrypto;

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
