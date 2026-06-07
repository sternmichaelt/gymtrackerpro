"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSavedRoutines } from "@/hooks/use-saved-routines";
import { cn } from "@/lib/utils";
import type { SavedRoutine } from "@/lib/queries/templates-client";
import type { Exercise, ExerciseSetDefaults } from "@/lib/types/database";

type Step = "menu" | "routines" | "exercise";

interface WorkoutStartProps {
  userId: string;
  templates: SavedRoutine[];
  routineDefaults?: Record<string, Record<string, ExerciseSetDefaults>>;
}

function getExerciseCount(routine: SavedRoutine) {
  return (routine.workout_template_exercises ?? []).filter(
    (entry) => entry.exercises != null
  ).length;
}

function getTemplateExercises(template?: SavedRoutine) {
  return (
    template?.workout_template_exercises
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((entry) => entry.exercises)
      .filter((exercise): exercise is Exercise => exercise !== null) ?? []
  );
}

export function WorkoutStart({
  userId,
  templates,
  routineDefaults = {},
}: WorkoutStartProps) {
  const [step, setStep] = useState<Step>("menu");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const init = useWorkoutStore((s) => s.init);
  const workout = useWorkoutStore((s) => s.workout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const { routines, loading } = useSavedRoutines(userId, templates);
  const savedRoutines = routines.length > 0 ? routines : templates;

  useEffect(() => {
    init(userId);
  }, [init, userId]);

  if (
    workout?.status === "in_progress" ||
    workout?.status === "paused"
  ) {
    return (
      <ActiveWorkout
        userId={userId}
        initialRoutines={savedRoutines}
        routineDefaults={routineDefaults}
      />
    );
  }

  const selectedRoutine = selectedRoutineId
    ? savedRoutines.find((routine) => routine.id === selectedRoutineId)
    : null;
  const selectedExercises = getTemplateExercises(selectedRoutine ?? undefined);

  const handleStartRoutine = async () => {
    if (!selectedRoutine || selectedExercises.length === 0) return;

    setStarting(true);
    try {
      await startWorkout(
        userId,
        selectedExercises,
        selectedRoutine.id,
        routineDefaults[selectedRoutine.id] ?? {},
        selectedRoutine.name
      );
    } catch {
      toast.error("Failed to start workout");
    } finally {
      setStarting(false);
    }
  };

  if (step === "routines") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => {
            setSelectedRoutineId(null);
            setStep("menu");
          }}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Choose a Routine</h1>
          <p className="text-muted-foreground">Select one of your saved routines</p>
        </div>

        {loading && savedRoutines.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading routines...
          </p>
        ) : savedRoutines.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-muted-foreground">No saved routines yet</p>
            <Button asChild>
              <Link href="/templates/new">Create a Routine</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {savedRoutines.map((routine) => {
                const count = getExerciseCount(routine);
                const isSelected = selectedRoutineId === routine.id;
                return (
                  <button
                    key={routine.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                      isSelected && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedRoutineId(routine.id)}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{routine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {count} exercise{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedRoutine && (
              <section className="space-y-3 border-t pt-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedRoutine.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedExercises.length} exercise
                    {selectedExercises.length === 1 ? "" : "s"} in this workout
                  </p>
                </div>

                {selectedExercises.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-sm text-muted-foreground">
                      No exercises in this routine yet.{" "}
                      <Link
                        href={`/templates/${selectedRoutine.id}`}
                        className="text-primary underline"
                      >
                        Add exercises
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <ul className="space-y-2">
                    {selectedExercises.map((exercise, index) => {
                      const last = routineDefaults[selectedRoutine.id]?.[exercise.id];
                      return (
                        <li
                          key={exercise.id}
                          className="flex items-center justify-between gap-3 rounded-xl border p-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium">
                              {index + 1}. {exercise.name}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="secondary">{exercise.muscle_group}</Badge>
                              <Badge variant="outline">{exercise.equipment_type}</Badge>
                            </div>
                          </div>
                          {last?.reps != null && last?.weight != null && (
                            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                              {last.reps} × {last.weight} lbs
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <Button
                  className="h-12 w-full"
                  disabled={starting || selectedExercises.length === 0}
                  onClick={handleStartRoutine}
                >
                  {starting ? "Starting..." : `Start ${selectedRoutine.name}`}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  if (step === "exercise") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => setStep("menu")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Add Single Exercise</h1>
          <p className="text-muted-foreground">Exercise picker coming next</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-muted-foreground">How would you like to start?</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
          onClick={() => setStep("routines")}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutList className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Start Workout with a Routine</p>
            <p className="text-sm text-muted-foreground">
              Add all exercises from one of your routines
            </p>
          </div>
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
          onClick={() => setStep("exercise")}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Single Exercise</p>
            <p className="text-sm text-muted-foreground">
              Pick one exercise to add to today&apos;s workout
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
