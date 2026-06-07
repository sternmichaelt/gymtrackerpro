-- Create a full-body example routine for new users on signup.

create or replace function public.create_example_routine(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template_id uuid;
  v_exercise_names text[] := array[
    'Rowing Machine',
    'Treadmill Run',
    'Back Squat',
    'Barbell Bench Press',
    'Barbell Row',
    'Overhead Press'
  ];
  v_name text;
  v_exercise_id uuid;
  v_sort_order integer := 0;
begin
  if exists (
    select 1
    from public.workout_templates
    where user_id = p_user_id and name = 'Example Routine'
  ) then
    return;
  end if;

  insert into public.workout_templates (user_id, name)
  values (p_user_id, 'Example Routine')
  returning id into v_template_id;

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );

  perform public.create_example_routine(new.id);

  return new;
end;
$$;
