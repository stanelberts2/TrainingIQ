-- One-off cleanup run on 2026-06-22.
-- Creates backup tables before deleting placeholder rows and safe duplicate rows.

create table if not exists cleanup_deleted_workouts_20260622 as
select
  w.*,
  ''::text as cleanup_reason,
  now() as cleanup_at
from workouts w
where false;

create table if not exists cleanup_deleted_workout_laps_20260622 as
select
  wl.*,
  ''::text as cleanup_reason,
  now() as cleanup_at
from workout_laps wl
where false;

create table if not exists cleanup_deleted_workout_segments_20260622 as
select
  ws.*,
  ''::text as cleanup_reason,
  now() as cleanup_at
from workout_segments ws
where false;

with placeholder_ids as (
  select id
  from workouts
  where source = 'google_sheets'
    and title = 'Training'
    and workout_type = 'general'
    and coalesce(duration_min, 0) = 0
    and coalesce(distance_km, 0) = 0
    and coalesce(avg_hr, 0) = 0
    and coalesce(max_hr, 0) = 0
    and coalesce(notes, '') = ''
)
insert into cleanup_deleted_workouts_20260622
select w.*, 'placeholder_google_sheets_training' as cleanup_reason, now() as cleanup_at
from workouts w
join placeholder_ids p on p.id = w.id
where not exists (
  select 1
  from cleanup_deleted_workouts_20260622 b
  where b.id = w.id
);

with candidates as (
  select
    id,
    date,
    lower(regexp_replace(trim(title), '\s+', ' ', 'g')) as title_key,
    duration_min,
    distance_km
  from workouts
  where title is not null
    and title <> ''
    and title <> 'Training'
),
duplicate_groups as (
  select a.date, a.title_key
  from candidates a
  join candidates b
    on a.id < b.id
   and a.date = b.date
   and a.title_key = b.title_key
   and (
      coalesce(a.duration_min, 0) = 0
      or coalesce(b.duration_min, 0) = 0
      or abs(coalesce(a.duration_min, 0) - coalesce(b.duration_min, 0)) <= 2
   )
   and (
      coalesce(a.distance_km, 0) = 0
      or coalesce(b.distance_km, 0) = 0
      or abs(coalesce(a.distance_km, 0) - coalesce(b.distance_km, 0)) <= 0.15
   )
  group by a.date, a.title_key
),
ranked as (
  select
    w.id,
    row_number() over (
      partition by w.date, lower(regexp_replace(trim(w.title), '\s+', ' ', 'g'))
      order by
        case when w.raw_payload ? 'reviewContext' then 1 else 0 end desc,
        case when lower(w.workout_type) like '%hyrox%' then 1 else 0 end desc,
        case when w.workout_type not in ('run', 'general') then 1 else 0 end desc,
        w.updated_at desc nulls last,
        w.created_at desc nulls last
    ) as rn
  from workouts w
  join duplicate_groups g
    on g.date = w.date
   and g.title_key = lower(regexp_replace(trim(w.title), '\s+', ' ', 'g'))
),
duplicate_delete_ids as (
  select id
  from ranked
  where rn > 1
)
insert into cleanup_deleted_workouts_20260622
select w.*, 'safe_duplicate_same_date_title_metrics' as cleanup_reason, now() as cleanup_at
from workouts w
join duplicate_delete_ids d on d.id = w.id
where not exists (
  select 1
  from cleanup_deleted_workouts_20260622 b
  where b.id = w.id
);

insert into cleanup_deleted_workout_laps_20260622
select wl.*, b.cleanup_reason, now() as cleanup_at
from workout_laps wl
join cleanup_deleted_workouts_20260622 b on b.id = wl.workout_id
where not exists (
  select 1
  from cleanup_deleted_workout_laps_20260622 existing
  where existing.id = wl.id
);

insert into cleanup_deleted_workout_segments_20260622
select ws.*, b.cleanup_reason, now() as cleanup_at
from workout_segments ws
join cleanup_deleted_workouts_20260622 b on b.id = ws.workout_id
where not exists (
  select 1
  from cleanup_deleted_workout_segments_20260622 existing
  where existing.id = ws.id
);

delete from workouts w
using cleanup_deleted_workouts_20260622 b
where b.id = w.id;
