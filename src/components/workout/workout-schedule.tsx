"use client";

import { Check, Plus } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function WorkoutSchedule() {
  const workout = useWorkoutStore((s) => s.workout);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);

  if (!workout) return null;

  const completedCount = workout.exercises.filter((exercise) => {
    const set = exercise.sets[0];
    return set?.weight != null && set?.reps != null;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Today&apos;s Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {workout.exercises.length} exercises logged
          </p>
        </div>
        <ExercisePicker
          onSelect={addExercise}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          }
        />
      </div>

      {workout.exercises.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Add exercises to build your workout schedule.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workout.exercises.map((exercise, index) => {
            const set = exercise.sets[0];
            if (!set) return null;

            const isComplete = set.weight != null && set.reps != null;
            const hasPrevious =
              exercise.previousWeight != null || exercise.previousReps != null;

            return (
              <Card
                key={exercise.id}
                className={cn(
                  "transition-colors",
                  isComplete && "border-primary/40 bg-primary/5"
                )}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {index + 1}. {exercise.exerciseName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.muscleGroup.replace("_", " ")}
                      </p>
                    </div>
                    {isComplete && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  {hasPrevious && (
                    <p className="text-xs text-muted-foreground">
                      Last time:{" "}
                      <span className="font-medium text-foreground">
                        {exercise.previousWeight ?? "—"} lbs ×{" "}
                        {exercise.previousReps ?? "—"} reps
                      </span>
                    </p>
                  )}

                  <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Weight (lbs)
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder={exercise.previousWeight?.toString() ?? "0"}
                        value={set.weight != null ? String(set.weight) : ""}
                        onChange={(event) =>
                          updateSet(exercise.id, set.id, {
                            weight: parseNumber(event.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Reps
                      </label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={exercise.previousReps?.toString() ?? "0"}
                        value={set.reps != null ? String(set.reps) : ""}
                        onChange={(event) =>
                          updateSet(exercise.id, set.id, {
                            reps: parseNumber(event.target.value),
                          })
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-8"
                      variant={isComplete ? "secondary" : "default"}
                      disabled={set.weight == null || set.reps == null}
                      onClick={() => completeSet(exercise.id, set.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
