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

create index if not exists workout_segments_workout_idx
  on workout_segments (workout_id, segment_index);

create index if not exists workout_segments_type_idx
  on workout_segments (segment_type, workout_id);

alter table workout_segments enable row level security;

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
