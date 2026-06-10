"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isExerciseComplete } from "@/lib/workout-utils";
import type { ActiveWorkoutExercise } from "@/lib/types/database";

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSetCount(value: string) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(20, Math.max(1, parsed));
}

interface WorkoutExerciseRowProps {
  exercise: ActiveWorkoutExercise;
  index: number;
}

export function WorkoutExerciseRow({ exercise, index }: WorkoutExerciseRowProps) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const addSet = useWorkoutStore((s) => s.addSet);
  const deleteSet = useWorkoutStore((s) => s.deleteSet);

  const primarySet = exercise.sets[0];
  const [setsDraft, setSetsDraft] = useState(String(exercise.sets.length));

  useEffect(() => {
    setSetsDraft(String(exercise.sets.length));
  }, [exercise.sets.length]);

  if (!primarySet) return null;

  const isComplete = exercise.sets.every((set) => isExerciseComplete(set));
  const canComplete =
    primarySet.reps != null &&
    primarySet.weight != null &&
    exercise.sets.length > 0;

  const adjustSetCount = async (count: number) => {
    let entry = useWorkoutStore
      .getState()
      .workout?.exercises.find((item) => item.id === exercise.id);
    if (!entry) return;

    while (entry.sets.length < count) {
      await addSet(exercise.id);
      entry = useWorkoutStore
        .getState()
        .workout?.exercises.find((item) => item.id === exercise.id);
      if (!entry) return;
    }

    while (entry.sets.length > count) {
      const last = entry.sets[entry.sets.length - 1];
      await deleteSet(exercise.id, last.id);
      entry = useWorkoutStore
        .getState()
        .workout?.exercises.find((item) => item.id === exercise.id);
      if (!entry) return;
    }
  };

  const handleCheckedChange = async (checked: boolean) => {
    const fresh = useWorkoutStore
      .getState()
      .workout?.exercises.find((item) => item.id === exercise.id);
    if (!fresh) return;

    if (checked) {
      for (const set of fresh.sets) {
        const reps = set.reps ?? fresh.sets[0]?.reps;
        const weight = set.weight ?? fresh.sets[0]?.weight;
        if (reps == null || weight == null) continue;

        if (set.reps !== reps || set.weight !== weight) {
          await updateSet(exercise.id, set.id, { reps, weight });
        }
        if (!set.completedAt) {
          await completeSet(exercise.id, set.id);
        }
      }
      return;
    }

    for (const set of fresh.sets) {
      if (set.completedAt) {
        await updateSet(exercise.id, set.id, { completedAt: null });
      }
    }
  };

  const syncRepsToAllSets = async (reps: number | null) => {
    const fresh = useWorkoutStore
      .getState()
      .workout?.exercises.find((item) => item.id === exercise.id);
    if (!fresh) return;

    for (const set of fresh.sets) {
      await updateSet(exercise.id, set.id, { reps, completedAt: null });
    }
  };

  const syncWeightToAllSets = async (weight: number | null) => {
    const fresh = useWorkoutStore
      .getState()
      .workout?.exercises.find((item) => item.id === exercise.id);
    if (!fresh) return;

    for (const set of fresh.sets) {
      await updateSet(exercise.id, set.id, { weight, completedAt: null });
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_2.75rem_2.75rem_3.25rem] items-center gap-1.5 border-b px-1 py-2 last:border-b-0 sm:gap-2 sm:px-2",
        isComplete && "bg-primary/5"
      )}
    >
      <Checkbox
        className="size-7"
        checked={isComplete}
        disabled={!canComplete && !isComplete}
        onCheckedChange={handleCheckedChange}
        aria-label={`Mark ${exercise.exerciseName} complete`}
      />

      <p
        className={cn(
          "truncate text-sm font-medium leading-tight",
          isComplete && "text-primary"
        )}
        title={exercise.exerciseName}
      >
        <span className="text-muted-foreground">{index + 1}.</span>{" "}
        {exercise.exerciseName}
      </p>

      <Input
        className="h-8 px-1 text-center text-sm tabular-nums"
        type="number"
        inputMode="numeric"
        min={1}
        max={20}
        aria-label={`Sets for ${exercise.exerciseName}`}
        value={setsDraft}
        onChange={(event) => setSetsDraft(event.target.value)}
        onBlur={() => {
          const count = parseSetCount(setsDraft);
          setSetsDraft(String(count));
          void adjustSetCount(count);
        }}
      />

      <Input
        className="h-8 px-1 text-center text-sm tabular-nums"
        type="number"
        inputMode="numeric"
        placeholder={exercise.previousReps?.toString() ?? "0"}
        aria-label={`Reps for ${exercise.exerciseName}`}
        value={primarySet.reps != null ? String(primarySet.reps) : ""}
        onChange={(event) => {
          void syncRepsToAllSets(parseNumber(event.target.value));
        }}
      />

      <Input
        className="h-8 px-1 text-center text-sm tabular-nums"
        type="number"
        inputMode="decimal"
        placeholder={exercise.previousWeight?.toString() ?? "0"}
        aria-label={`Weight for ${exercise.exerciseName}`}
        value={primarySet.weight != null ? String(primarySet.weight) : ""}
        onChange={(event) => {
          void syncWeightToAllSets(parseNumber(event.target.value));
        }}
      />
    </div>
  );
}
