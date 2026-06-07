-- Enums
create type session_status as enum ('in_progress', 'paused', 'completed', 'cancelled');

-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  weight_unit text not null default 'lbs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- exercises
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment_type text not null,
  description text,
  is_system boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workout_templates
create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workout_template_exercises
create table workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  sort_order integer not null default 0
);

-- workout_sessions
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  template_id uuid references workout_templates(id) on delete set null,
  status session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- workout_session_exercises
create table workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  sort_order integer not null default 0
);

-- sets
create table sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_exercise_id uuid not null
    references workout_session_exercises(id) on delete cascade,
  set_number integer not null,
  weight decimal(8,2),
  reps integer,
  notes text,
  is_warmup boolean not null default false,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_exercises_muscle on exercises(muscle_group) where is_archived = false;
create index idx_exercises_system on exercises(is_system) where is_archived = false;
create index idx_exercises_created_by on exercises(created_by);
create index idx_templates_user on workout_templates(user_id);
create index idx_template_exercises_template on workout_template_exercises(template_id);
create index idx_sessions_user_status on workout_sessions(user_id, status);
create index idx_sessions_user_completed on workout_sessions(user_id, completed_at desc nulls last);
create unique index idx_one_active_session_per_user
  on workout_sessions(user_id)
  where status in ('in_progress', 'paused');
create index idx_session_exercises_session on workout_session_exercises(session_id);
create index idx_sets_session_exercise on sets(workout_session_exercise_id);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger exercises_updated_at
  before update on exercises
  for each row execute function update_updated_at();

create trigger templates_updated_at
  before update on workout_templates
  for each row execute function update_updated_at();

-- profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table exercises enable row level security;
alter table workout_templates enable row level security;
alter table workout_template_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_session_exercises enable row level security;
alter table sets enable row level security;

-- profiles policies
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- exercises policies
create policy "Anyone reads system exercises"
  on exercises for select
  using (is_system = true and is_archived = false);

create policy "Users read own custom exercises"
  on exercises for select
  using (created_by = auth.uid() and is_archived = false);

create policy "Users insert custom exercises"
  on exercises for insert
  with check (created_by = auth.uid() and is_system = false);

create policy "Users update own custom exercises"
  on exercises for update
  using (created_by = auth.uid() and is_system = false);

create policy "Users delete own custom exercises"
  on exercises for delete
  using (created_by = auth.uid() and is_system = false);

-- workout_templates policies
create policy "Users manage own templates"
  on workout_templates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- workout_template_exercises policies
create policy "Users manage own template exercises"
  on workout_template_exercises for all
  using (
    exists (
      select 1 from workout_templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );

-- workout_sessions policies
create policy "Users manage own sessions"
  on workout_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- workout_session_exercises policies
create policy "Users manage own session exercises"
  on workout_session_exercises for all
  using (
    exists (
      select 1 from workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- sets policies
create policy "Users manage own sets"
  on sets for all
  using (
    exists (
      select 1 from workout_session_exercises wse
      join workout_sessions s on s.id = wse.session_id
      where wse.id = workout_session_exercise_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_session_exercises wse
      join workout_sessions s on s.id = wse.session_id
      where wse.id = workout_session_exercise_id and s.user_id = auth.uid()
    )
  );

-- PR view
create or replace view exercise_personal_records as
select
  s.user_id,
  wse.exercise_id,
  max(st.weight) filter (where st.reps <= 1) as max_weight,
  max(st.weight * (1 + st.reps::decimal / 30)) as max_estimated_1rm,
  max(st.weight * st.reps) as max_set_volume,
  max(
    (
      select sum(st2.weight * st2.reps)
      from sets st2
      join workout_session_exercises wse2 on wse2.id = st2.workout_session_exercise_id
      join workout_sessions s2 on s2.id = wse2.session_id
      where wse2.exercise_id = wse.exercise_id
        and s2.user_id = s.user_id
        and s2.id = s.id
    )
  ) as max_workout_volume
from sets st
join workout_session_exercises wse on wse.id = st.workout_session_exercise_id
join workout_sessions s on s.id = wse.session_id
where s.status = 'completed'
  and st.weight is not null
  and st.reps is not null
group by s.user_id, wse.exercise_id;
