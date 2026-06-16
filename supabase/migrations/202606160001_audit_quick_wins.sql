-- Audit quick wins: webhook deduplication and profile context fields.
-- Safe additive migration; does not change existing primary keys.

alter table profiles
  add column if not exists hyrox_division text not null default '',
  add column if not exists age_group text not null default '',
  add column if not exists unit_system text not null default 'metric'
    check (unit_system in ('metric', 'imperial'));

create unique index if not exists strava_webhook_events_dedupe_idx
  on strava_webhook_events (owner_id, object_type, object_id, aspect_type, event_time);

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

create index if not exists activity_streams_workout_idx
  on activity_streams (workout_id, stream_type);

alter table activity_streams enable row level security;

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
