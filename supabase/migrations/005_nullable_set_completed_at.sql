alter table public.sets
  alter column completed_at drop not null,
  alter column completed_at drop default;
