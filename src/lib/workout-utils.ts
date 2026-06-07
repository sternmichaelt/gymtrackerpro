export function isExerciseComplete(set: {
  weight: number | null;
  reps: number | null;
  completedAt: string | null;
}) {
  return set.completedAt != null && set.weight != null && set.reps != null;
}

export function formatWorkoutDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatElapsedMinutes(startedAt: string, pausedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = pausedAt ? new Date(pausedAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / 60000));
}
