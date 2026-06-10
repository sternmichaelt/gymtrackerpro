"use client";

import { Plus } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isExerciseComplete, isWorkoutExerciseComplete } from "@/lib/workout-utils";
import type { ActiveWorkoutExercise } from "@/lib/types/database";

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface WorkoutExerciseRowProps {
  exercise: ActiveWorkoutExercise;
  index: number;
}

export function WorkoutExerciseRow({ exercise, index }: WorkoutExerciseRowProps) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const addSet = useWorkoutStore((s) => s.addSet);

  const isComplete = isWorkoutExerciseComplete(exercise);
  const canComplete = exercise.sets.some(
    (set) => set.reps != null && set.weight != null
  );

  const handleCheckedChange = async (checked: boolean) => {
    if (checked) {
      for (const set of exercise.sets) {
        if (set.reps != null && set.weight != null && !set.completedAt) {
          await completeSet(exercise.id, set.id);
        }
      }
      return;
    }

    for (const set of exercise.sets) {
      if (set.completedAt) {
        await updateSet(exercise.id, set.id, { completedAt: null });
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-3 space-y-3",
        isComplete && "border-primary/40 bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isComplete}
          disabled={!canComplete && !isComplete}
          onCheckedChange={handleCheckedChange}
          aria-label={`Mark ${exercise.exerciseName} complete`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {index + 1}. {exercise.exerciseName}
          </p>
          <p className="text-xs text-muted-foreground">
            {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-11">
        <div className="hidden grid-cols-[2.5rem_1fr_1fr] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
          <span>Set</span>
          <span className="text-center">Reps</span>
          <span className="text-center">lbs</span>
        </div>

        {exercise.sets.map((set) => {
          const setDone = isExerciseComplete(set);
          return (
            <div
              key={set.id}
              className={cn(
                "grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2",
                setDone && "opacity-80"
              )}
            >
              <span className="text-center text-sm font-medium text-muted-foreground">
                {set.setNumber}
              </span>
              <Input
                className="h-9 px-2 text-center text-sm tabular-nums"
                type="number"
                inputMode="numeric"
                placeholder={exercise.previousReps?.toString() ?? "0"}
                aria-label={`Set ${set.setNumber} reps for ${exercise.exerciseName}`}
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
                aria-label={`Set ${set.setNumber} weight for ${exercise.exerciseName}`}
                value={set.weight != null ? String(set.weight) : ""}
                onChange={(event) =>
                  updateSet(exercise.id, set.id, {
                    weight: parseNumber(event.target.value),
                  })
                }
              />
            </div>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => addSet(exercise.id)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add set
        </Button>
      </div>
    </div>
  );
}
