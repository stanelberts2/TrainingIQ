alter table workout_laps
  add column if not exists effort_goal text not null default ''
    check (
      effort_goal in (
        '',
        'z1',
        'z2',
        'z3',
        'threshold',
        'vo2max',
        'all_out',
        'race_pace',
        'recovery',
        'technique',
        'other'
      )
    );

create index if not exists workout_laps_effort_goal_idx
  on workout_laps (effort_goal, workout_id);
