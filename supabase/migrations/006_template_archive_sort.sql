alter table public.workout_templates
  add column if not exists is_archived boolean not null default false,
  add column if not exists sort_order integer not null default 0;

with ordered as (
  select
    id,
    row_number() over (partition by user_id order by created_at) - 1 as rn
  from public.workout_templates
)
update public.workout_templates t
set sort_order = o.rn
from ordered o
where t.id = o.id;

create index if not exists idx_templates_user_active_sort
  on public.workout_templates(user_id, sort_order)
  where is_archived = false;
