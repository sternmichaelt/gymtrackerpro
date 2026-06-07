import { createClient } from "@/lib/supabase/server";
import {
  EXAMPLE_ROUTINE_EXERCISES,
  EXAMPLE_ROUTINE_NAME,
} from "@/lib/data/example-routine";
import { isMissingTemplateColumnError } from "@/lib/templates-compat";

const TEMPLATE_SELECT = `
  *,
  workout_template_exercises (
    id,
    sort_order,
    exercises (id, name, muscle_group)
  )
`;

async function getExampleExerciseIds() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", [...EXAMPLE_ROUTINE_EXERCISES])
    .eq("is_system", true)
    .eq("is_archived", false);

  if (!exercises?.length) return [];

  const exerciseIds = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));
  return EXAMPLE_ROUTINE_EXERCISES.map((name) => exerciseIds.get(name)).filter(
    (id): id is string => Boolean(id)
  );
}

async function populateExampleRoutine(templateId: string, exerciseIds: string[]) {
  const supabase = await createClient();
  await supabase.from("workout_template_exercises").insert(
    exerciseIds.map((exerciseId, sortOrder) => ({
      template_id: templateId,
      exercise_id: exerciseId,
      sort_order: sortOrder,
    }))
  );
}

async function insertTemplateRecord(
  userId: string,
  name: string
) {
  const supabase = await createClient();

  const { data: last, error: lastError } = await supabase
    .from("workout_templates")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (!lastError) {
    const nextSortOrder = (last?.[0]?.sort_order ?? -1) + 1;
    const { data, error } = await supabase
      .from("workout_templates")
      .insert({
        user_id: userId,
        name,
        sort_order: nextSortOrder,
      })
      .select("id")
      .single();

    if (!error && data) return data;
    if (!isMissingTemplateColumnError(error)) throw error;
  }

  const { data, error } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, name })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function supportsTemplateArchive() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_templates")
    .select("is_archived, sort_order")
    .limit(1);

  return !isMissingTemplateColumnError(error);
}

export async function ensureExampleRoutine(userId: string) {
  const supabase = await createClient();
  const exerciseIds = await getExampleExerciseIds();

  if (exerciseIds.length < EXAMPLE_ROUTINE_EXERCISES.length) return;

  const { data: existing } = await supabase
    .from("workout_templates")
    .select(`
      id,
      workout_template_exercises (id)
    `)
    .eq("user_id", userId)
    .eq("name", EXAMPLE_ROUTINE_NAME)
    .maybeSingle();

  if (existing) {
    const exerciseCount = existing.workout_template_exercises?.length ?? 0;
    if (exerciseCount >= EXAMPLE_ROUTINE_EXERCISES.length) return;

    if (exerciseCount > 0) {
      await supabase
        .from("workout_template_exercises")
        .delete()
        .eq("template_id", existing.id);
    }

    await populateExampleRoutine(existing.id, exerciseIds);
    return;
  }

  try {
    const template = await insertTemplateRecord(userId, EXAMPLE_ROUTINE_NAME);
    await populateExampleRoutine(template.id, exerciseIds);
  } catch {
    return;
  }
}

export async function getTemplates(userId: string, archived = false) {
  const supabase = await createClient();

  if (archived) {
    const { data, error } = await supabase
      .from("workout_templates")
      .select(TEMPLATE_SELECT)
      .eq("user_id", userId)
      .eq("is_archived", true)
      .order("sort_order", { ascending: true });

    if (!error) return data ?? [];
    if (isMissingTemplateColumnError(error)) return [];
    return [];
  }

  const { data, error } = await supabase
    .from("workout_templates")
    .select(TEMPLATE_SELECT)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (!error) return data ?? [];

  const { data: legacy, error: legacyError } = await supabase
    .from("workout_templates")
    .select(TEMPLATE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (legacyError) return [];
  return legacy ?? [];
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
