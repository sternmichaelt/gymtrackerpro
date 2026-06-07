"use client";

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

interface ExerciseLogRowProps {
  exercise: ActiveWorkoutExercise;
  index: number;
}

export function ExerciseLogRow({ exercise, index }: ExerciseLogRowProps) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);

  const set = exercise.sets[0];
  if (!set) return null;

  const isComplete = isExerciseComplete(set);
  const canComplete = set.weight != null && set.reps != null;
  const hasPrevious =
    exercise.previousWeight != null || exercise.previousReps != null;

  const handleCheckedChange = async (checked: boolean) => {
    if (checked) {
      await completeSet(exercise.id, set.id);
      return;
    }
    await updateSet(exercise.id, set.id, { completedAt: null });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_3.5rem_4rem] items-center gap-2 rounded-lg border px-2 py-2.5 sm:grid-cols-[auto_1fr_4rem_4.5rem] sm:gap-3 sm:px-3",
        isComplete && "border-primary/40 bg-primary/5"
      )}
    >
      <Checkbox
        checked={isComplete}
        disabled={!canComplete && !isComplete}
        onCheckedChange={handleCheckedChange}
        aria-label={`Mark ${exercise.exerciseName} complete`}
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {index + 1}. {exercise.exerciseName}
        </p>
        {!isComplete && hasPrevious && (
          <p className="text-xs text-muted-foreground">
            Last: {exercise.previousReps ?? "—"} × {exercise.previousWeight ?? "—"} lbs
          </p>
        )}
        {isComplete && (
          <p className="text-xs text-primary">
            {set.reps} reps · {set.weight} lbs
          </p>
        )}
      </div>

      <Input
        className="h-9 px-2 text-center text-sm tabular-nums"
        type="number"
        inputMode="numeric"
        placeholder={exercise.previousReps?.toString() ?? "0"}
        aria-label={`Reps for ${exercise.exerciseName}`}
        value={set.reps != null ? String(set.reps) : ""}
        onChange={(event) =>
          updateSet(exercise.id, set.id, {
            reps: parseNumber(event.target.value),
          })
        }
      />

      <Input
        className="h-9 px-2 text-center text-sm tabular-nums"
        type="number"
        inputMode="decimal"
        placeholder={exercise.previousWeight?.toString() ?? "0"}
        aria-label={`Weight for ${exercise.exerciseName}`}
        value={set.weight != null ? String(set.weight) : ""}
        onChange={(event) =>
          updateSet(exercise.id, set.id, {
            weight: parseNumber(event.target.value),
          })
        }
      />
    </div>
  );
}
