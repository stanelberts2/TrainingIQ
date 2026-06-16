alter table workout_segments
  add column if not exists sets integer not null default 0;

alter table workout_segments
  drop constraint if exists workout_segments_segment_type_check;

alter table workout_segments
  add constraint workout_segments_segment_type_check
  check (
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
  );
