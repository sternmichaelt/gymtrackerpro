-- Backfill empty Example Routine rows and use the updated exercise list.

create or replace function public.create_example_routine(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template_id uuid;
  v_exercise_names text[] := array[
    'Treadmill Run',
    'Assault Bike',
    'Barbell Bench Press',
    'Back Squat',
    'Seated Cable Row',
    'Lat Pulldown'
  ];
  v_name text;
  v_exercise_id uuid;
  v_sort_order integer := 0;
begin
  select id into v_template_id
  from public.workout_templates
  where user_id = p_user_id and name = 'Example Routine'
  limit 1;

  if v_template_id is not null and exists (
    select 1
    from public.workout_template_exercises
    where template_id = v_template_id
  ) then
    return;
  end if;

  if v_template_id is null then
    insert into public.workout_templates (user_id, name)
    values (p_user_id, 'Example Routine')
    returning id into v_template_id;
  end if;

  foreach v_name in array v_exercise_names loop
    select id into v_exercise_id
    from public.exercises
    where name = v_name
      and is_system = true
      and is_archived = false
    limit 1;

    if v_exercise_id is not null then
      insert into public.workout_template_exercises (template_id, exercise_id, sort_order)
      values (v_template_id, v_exercise_id, v_sort_order);

      v_sort_order := v_sort_order + 1;
    end if;
  end loop;
end;
$$;
