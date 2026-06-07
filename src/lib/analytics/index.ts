export function setVolume(weight: number | null, reps: number | null): number {
  if (weight == null || reps == null) return 0;
  return weight * reps;
}

export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0) return weight;
  return weight * (1 + reps / 30);
}

export function totalVolume(sets: { weight: number | null; reps: number | null }[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0);
}

export function workoutDurationMinutes(
  startedAt: string,
  completedAt: string | null,
  pausedAt: string | null
): number {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const paused = pausedAt ? Date.now() - new Date(pausedAt).getTime() : 0;
  return Math.round((end - start - paused) / 60000);
}

export function calculateStreak(
  completedDates: string[]
): number {
  if (completedDates.length === 0) return 0;

  const uniqueDays = [
    ...new Set(
      completedDates.map((d) => new Date(d).toISOString().split("T")[0])
    ),
  ].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let checkDate = uniqueDays[0] === today ? today : yesterday;

  for (const day of uniqueDays) {
    if (day === checkDate) {
      streak++;
      const prev = new Date(checkDate);
      prev.setDate(prev.getDate() - 1);
      checkDate = prev.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return streak;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  max1RM: number;
  maxVolume: number;
}

export function computePersonalRecords(
  data: {
    exerciseId: string;
    exerciseName: string;
    sets: { weight: number | null; reps: number | null }[];
  }[]
): PersonalRecord[] {
  return data
    .map(({ exerciseId, exerciseName, sets }) => {
      const validSets = sets.filter(
        (s) => s.weight != null && s.reps != null
      ) as { weight: number; reps: number }[];

      if (validSets.length === 0) return null;

      const maxWeight = Math.max(...validSets.map((s) => s.weight));
      const max1RM = Math.max(
        ...validSets.map((s) => estimated1RM(s.weight, s.reps))
      );
      const maxVolume = Math.max(
        ...validSets.map((s) => setVolume(s.weight, s.reps))
      );

      return { exerciseId, exerciseName, maxWeight, max1RM, maxVolume };
    })
    .filter((r): r is PersonalRecord => r !== null)
    .sort((a, b) => b.max1RM - a.max1RM);
}

export function weeklyVolumeData(
  sessions: { completed_at: string | null; volume: number }[],
  weeks = 12
): { week: string; volume: number; count: number }[] {
  const result: Record<string, { volume: number; count: number }> = {};

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = `W${getWeekNumber(d)}`;
    result[key] = { volume: 0, count: 0 };
  }

  sessions.forEach((s) => {
    if (!s.completed_at) return;
    const d = new Date(s.completed_at);
    const key = `W${getWeekNumber(d)}`;
    if (result[key]) {
      result[key].volume += s.volume;
      result[key].count += 1;
    }
  });

  return Object.entries(result).map(([week, data]) => ({
    week,
    ...data,
  }));
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}
