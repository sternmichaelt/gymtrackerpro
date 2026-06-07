import { createClient } from "@/lib/supabase/server";
import {
  EXAMPLE_ROUTINE_EXERCISES,
  EXAMPLE_ROUTINE_NAME,
} from "@/lib/data/example-routine";

export async function ensureExampleRoutine(userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("name", EXAMPLE_ROUTINE_NAME)
    .maybeSingle();

  if (existing) return;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", [...EXAMPLE_ROUTINE_EXERCISES])
    .eq("is_system", true)
    .eq("is_archived", false);

  if (!exercises?.length) return;

  const exerciseIds = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));
  const orderedExerciseIds = EXAMPLE_ROUTINE_EXERCISES.map((name) =>
    exerciseIds.get(name)
  ).filter((id): id is string => Boolean(id));

  if (orderedExerciseIds.length < EXAMPLE_ROUTINE_EXERCISES.length) return;

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, name: EXAMPLE_ROUTINE_NAME })
    .select("id")
    .single();

  if (templateError || !template) return;

  await supabase.from("workout_template_exercises").insert(
    orderedExerciseIds.map((exerciseId, sortOrder) => ({
      template_id: template.id,
      exercise_id: exerciseId,
      sort_order: sortOrder,
    }))
  );
}

export async function getTemplates(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(`
      *,
      workout_template_exercises (
        id,
        sort_order,
        exercises (id, name, muscle_group)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getTemplate(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(`
      *,
      workout_template_exercises (
        id,
        sort_order,
        exercise_id,
        exercises (*)
      )
    `)
    .eq("id", id)
    .single();
  return data;
}
