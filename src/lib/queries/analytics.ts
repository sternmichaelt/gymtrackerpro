import { createClient } from "@/lib/supabase/server";
import {
  calculateStreak,
  computePersonalRecords,
  estimated1RM,
  totalVolume,
  weeklyVolumeData,
} from "@/lib/analytics";

function getExercise(
  exercises: { id: string; name: string } | { id: string; name: string }[] | null | undefined
): { id: string; name: string } | null {
  if (!exercises) return null;
  if (Array.isArray(exercises)) return exercises[0] ?? null;
  return exercises;
}

export async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(`
      id,
      completed_at,
      workout_session_exercises (
        sets (weight, reps),
        exercises (id, name)
      )
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const allSessions = sessions ?? [];
  const weekSessions = allSessions.filter(
    (s) => s.completed_at && new Date(s.completed_at) >= weekAgo
  );

  let weekVolume = 0;
  const exerciseMap = new Map<string, { exerciseId: string; exerciseName: string; sets: { weight: number | null; reps: number | null }[] }>();

  for (const session of allSessions) {
    for (const ex of session.workout_session_exercises ?? []) {
      const sets = ex.sets ?? [];
      const exercise = getExercise(ex.exercises);
      if (!exercise) continue;

      const existing = exerciseMap.get(exercise.id);
      if (existing) {
        existing.sets.push(...sets);
      } else {
        exerciseMap.set(exercise.id, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: [...sets],
        });
      }
    }
  }

  for (const session of weekSessions) {
    for (const ex of session.workout_session_exercises ?? []) {
      weekVolume += totalVolume(ex.sets ?? []);
    }
  }

  const personalRecords = computePersonalRecords([...exerciseMap.values()]).slice(0, 5);
  const streak = calculateStreak(
    allSessions.map((s) => s.completed_at).filter(Boolean) as string[]
  );

  const volumeSessions = allSessions
    .filter((s) => s.completed_at)
    .map((s) => {
      const sets = (s.workout_session_exercises ?? []).flatMap(
        (e: { sets?: { weight: number | null; reps: number | null }[] }) => e.sets ?? []
      );
      return { completed_at: s.completed_at, volume: totalVolume(sets) };
    });

  return {
    weekWorkouts: weekSessions.length,
    weekVolume,
    streak,
    personalRecords,
    weeklyData: weeklyVolumeData(volumeSessions),
    totalWorkouts: allSessions.length,
  };
}

export async function getProgressData(userId: string) {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(`
      completed_at,
      workout_session_exercises (
        sets (weight, reps),
        exercises (id, name)
      )
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const allSessions = sessions ?? [];
  const exerciseMap = new Map<string, { exerciseId: string; exerciseName: string; sets: { weight: number | null; reps: number | null }[] }>();

  for (const session of allSessions) {
    for (const ex of session.workout_session_exercises ?? []) {
      const exercise = getExercise(ex.exercises);
      if (!exercise) continue;
      const existing = exerciseMap.get(exercise.id);
      const sets = ex.sets ?? [];
      if (existing) {
        existing.sets.push(...sets);
      } else {
        exerciseMap.set(exercise.id, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: [...sets],
        });
      }
    }
  }

  const volumeSessions = allSessions
    .filter((s) => s.completed_at)
    .map((s) => {
      const sets = (s.workout_session_exercises ?? []).flatMap(
        (e: { sets?: { weight: number | null; reps: number | null }[] }) => e.sets ?? []
      );
      return { completed_at: s.completed_at, volume: totalVolume(sets) };
    });

  return {
    personalRecords: computePersonalRecords([...exerciseMap.values()]),
    weeklyData: weeklyVolumeData(volumeSessions),
    streak: calculateStreak(
      allSessions.map((s) => s.completed_at).filter(Boolean) as string[]
    ),
    totalWorkouts: allSessions.length,
    frequency: allSessions.length > 0
      ? Math.round((allSessions.length / 12) * 10) / 10
      : 0,
  };
}

export { estimated1RM, totalVolume };
