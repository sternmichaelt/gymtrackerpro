import { createClient } from "@/lib/supabase/server";
import { totalVolume } from "@/lib/analytics";

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
