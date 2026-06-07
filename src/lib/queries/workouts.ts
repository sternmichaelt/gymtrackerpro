import { createClient } from "@/lib/supabase/server";
import { totalVolume } from "@/lib/analytics";
import type { ExerciseSetDefaults } from "@/lib/types/database";

type RoutineSetRow = {
  weight: number | null;
  reps: number | null;
  set_number: number;
};

type RoutineExerciseRow = {
  exercise_id: string;
  sets: RoutineSetRow[] | null;
};

export async function getLastRoutineSets(
  userId: string,
  templateId: string
): Promise<Record<string, ExerciseSetDefaults>> {
  const supabase = await createClient();
  const { data: lastSession } = await supabase
    .from("workout_sessions")
    .select(`
      workout_session_exercises (
        exercise_id,
        sets (weight, reps, set_number)
      )
    `)
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastSession?.workout_session_exercises) return {};

  const defaults: Record<string, ExerciseSetDefaults> = {};

  for (const entry of lastSession.workout_session_exercises as RoutineExerciseRow[]) {
    const sets = [...(entry.sets ?? [])].sort(
      (a, b) => b.set_number - a.set_number
    );
    const lastSet = sets.find((set) => set.weight != null || set.reps != null) ?? sets[0];

    if (lastSet) {
      defaults[entry.exercise_id] = {
        weight: lastSet.weight != null ? Number(lastSet.weight) : null,
        reps: lastSet.reps,
      };
    }
  }

  return defaults;
}

export async function getRoutineDefaultsForTemplates(
  userId: string,
  templateIds: string[]
) {
  const defaults: Record<string, Record<string, ExerciseSetDefaults>> = {};

  await Promise.all(
    templateIds.map(async (templateId) => {
      defaults[templateId] = await getLastRoutineSets(userId, templateId);
    })
  );

  return defaults;
}

export async function getCompletedSessions(userId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_session_exercises (
        id,
        exercise_id,
        exercises (name),
        sets (weight, reps)
      )
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((session) => {
    const exercises = session.workout_session_exercises ?? [];
    const allSets = exercises.flatMap(
      (e: { sets?: { weight: number | null; reps: number | null }[] }) => e.sets ?? []
    );
    return {
      ...session,
      volume: totalVolume(allSets),
      exerciseCount: exercises.length,
    };
  });
}

export async function getActiveSession(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["in_progress", "paused"])
    .maybeSingle();
  return data;
}

export async function getSessionDetail(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_templates (name),
      workout_session_exercises (
        id,
        sort_order,
        exercises (id, name, muscle_group, equipment_type),
        sets (*)
      )
    `)
    .eq("id", sessionId)
    .single();
  return data;
}
