"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { WorkoutAddMenu } from "@/components/workout/workout-add-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isExerciseComplete } from "@/lib/workout-utils";

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function WorkoutSchedule() {
  const workout = useWorkoutStore((s) => s.workout);
  const exercises = useWorkoutStore((s) => s.workout?.exercises ?? []);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);

  if (!workout) return null;

  const completedCount = exercises.filter((exercise) => {
    const set = exercise.sets[0];
    return set && isExerciseComplete(set);
  }).length;
  const progress =
    exercises.length > 0
      ? Math.round((completedCount / exercises.length) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {completedCount} of {exercises.length} complete
          </p>
          <p className="text-sm text-muted-foreground">{progress}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Log reps and weight for each exercise</p>
        <WorkoutAddMenu
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          }
        />
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No exercises yet. Add a saved routine or pick single exercises.
            </p>
            <WorkoutAddMenu
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Workout
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise, index) => {
            const set = exercise.sets[0];
            if (!set) return null;

            const isComplete = isExerciseComplete(set);
            const hasPrevious =
              exercise.previousWeight != null || exercise.previousReps != null;

            return (
              <div
                key={exercise.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  isComplete && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {index + 1}. {exercise.exerciseName}
                    </p>
                    {isComplete ? (
                      <p className="text-xs text-primary">
                        {set.reps} reps · {set.weight} lbs
                      </p>
                    ) : hasPrevious ? (
                      <p className="text-xs text-muted-foreground">
                        Last: {exercise.previousReps ?? "—"} × {exercise.previousWeight ?? "—"} lbs
                      </p>
                    ) : null}
                  </div>

                  {!isComplete && (
                    <>
                      <Input
                        className="h-9 w-14 px-2 text-center text-sm"
                        type="number"
                        inputMode="numeric"
                        placeholder={exercise.previousReps?.toString() ?? "0"}
                        aria-label="Reps"
                        value={set.reps != null ? String(set.reps) : ""}
                        onChange={(event) =>
                          updateSet(exercise.id, set.id, {
                            reps: parseNumber(event.target.value),
                          })
                        }
                      />
                      <Input
                        className="h-9 w-16 px-2 text-center text-sm"
                        type="number"
                        inputMode="decimal"
                        placeholder={exercise.previousWeight?.toString() ?? "0"}
                        aria-label="Weight in lbs"
                        value={set.weight != null ? String(set.weight) : ""}
                        onChange={(event) =>
                          updateSet(exercise.id, set.id, {
                            weight: parseNumber(event.target.value),
                          })
                        }
                      />
                      <Button
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={set.weight == null || set.reps == null}
                        onClick={() => completeSet(exercise.id, set.id)}
                        aria-label="Complete exercise"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {isComplete && (
                    <>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          updateSet(exercise.id, set.id, { completedAt: null })
                        }
                        aria-label="Edit exercise"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
