-- Label laps/intervals by exercise so imported erg workouts can be compared by station.

alter table workout_laps
  add column if not exists exercise_type text not null default ''
    check (
      exercise_type in (
        '',
        'run',
        'ski_erg',
        'row_erg',
        'bike_erg',
        'strength',
        'rest',
        'transition',
        'other'
      )
    ),
  add column if not exists lap_role text not null default 'work'
    check (lap_role in ('work', 'recovery', 'warmup', 'cooldown', 'transition', 'unknown'));

create index if not exists workout_laps_exercise_type_idx
  on workout_laps (exercise_type, workout_id);
