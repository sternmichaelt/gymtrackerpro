export function isExerciseComplete(set: {
  weight: number | null;
  reps: number | null;
  completedAt: string | null;
}) {
  return set.completedAt != null && set.weight != null && set.reps != null;
}

export function countCompletedExercises(
  exercises: { sets: { weight: number | null; reps: number | null; completedAt: string | null }[] }[]
) {
  return exercises.filter((exercise) => {
    const set = exercise.sets[0];
    return set && isExerciseComplete(set);
  }).length;
}

export function getWorkoutProgress(
  exercises: { sets: { weight: number | null; reps: number | null; completedAt: string | null }[] }[]
) {
  const completed = countCompletedExercises(exercises);
  const total = exercises.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
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

export function formatElapsedTime(startedAt: string, pausedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = pausedAt ? new Date(pausedAt).getTime() : Date.now();
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
