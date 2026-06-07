import { createClient } from "@/lib/supabase/client";
import { isMissingTemplateColumnError } from "@/lib/templates-compat";
import type { Exercise } from "@/lib/types/database";

export interface SavedRoutine {
  id: string;
  name: string;
  workout_template_exercises?: {
    sort_order: number;
    exercises: Exercise | null;
  }[];
}

const ROUTINE_SELECT = `
  id,
  name,
  workout_template_exercises (
    sort_order,
    exercises (id, name, muscle_group, equipment_type, is_system, is_archived, user_id, created_at)
  )
`;

function normalizeRoutines(data: unknown): SavedRoutine[] {
  if (!Array.isArray(data)) return [];

  return data.map((template) => {
    const entries = (template.workout_template_exercises ?? []) as {
      sort_order: number;
      exercises: Exercise | Exercise[] | null;
    }[];

    return {
      id: template.id as string,
      name: template.name as string,
      workout_template_exercises: entries.map((entry) => ({
        sort_order: entry.sort_order,
        exercises: Array.isArray(entry.exercises)
          ? entry.exercises[0] ?? null
          : entry.exercises,
      })),
    };
  });
}

export async function fetchSavedRoutines(userId: string): Promise<SavedRoutine[]> {
  const supabase = createClient();

  const modernQuery = await supabase
    .from("workout_templates")
    .select(ROUTINE_SELECT)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (!modernQuery.error) {
    return normalizeRoutines(modernQuery.data);
  }

  if (isMissingTemplateColumnError(modernQuery.error)) {
    const legacyQuery = await supabase
      .from("workout_templates")
      .select(ROUTINE_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return normalizeRoutines(legacyQuery.data);
  }

  return [];
}
