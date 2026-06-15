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

create index if not exists personal_records_user_metric_idx
  on personal_records (user_id, segment_type, metric_name);

create index if not exists training_goals_user_status_idx
  on training_goals (user_id, status, due_date);

drop trigger if exists personal_records_set_updated_at on personal_records;
create trigger personal_records_set_updated_at
  before update on personal_records
  for each row execute function set_updated_at();

drop trigger if exists training_goals_set_updated_at on training_goals;
create trigger training_goals_set_updated_at
  before update on training_goals
  for each row execute function set_updated_at();

alter table personal_records enable row level security;
alter table training_goals enable row level security;

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
