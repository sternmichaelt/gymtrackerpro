"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Dumbbell, LayoutList } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { Button } from "@/components/ui/button";
import { useSavedRoutines } from "@/hooks/use-saved-routines";
import type { SavedRoutine } from "@/lib/queries/templates-client";

type Step = "menu" | "routines" | "exercise";

interface WorkoutStartProps {
  userId: string;
  templates: SavedRoutine[];
}

function getExerciseCount(routine: SavedRoutine) {
  return (routine.workout_template_exercises ?? []).filter(
    (entry) => entry.exercises != null
  ).length;
}

export function WorkoutStart({ userId, templates }: WorkoutStartProps) {
  const [step, setStep] = useState<Step>("menu");
  const init = useWorkoutStore((s) => s.init);
  const workout = useWorkoutStore((s) => s.workout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  const { routines, loading } = useSavedRoutines(userId, templates);
  const savedRoutines = routines.length > 0 ? routines : templates;

  useEffect(() => {
    init(userId);
  }, [init, userId]);

  useEffect(() => {
    if (
      workout?.status === "in_progress" ||
      workout?.status === "paused"
    ) {
      cancelWorkout();
    }
  }, [workout?.status, cancelWorkout]);

  if (step === "routines") {
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
          <div className="space-y-2">
            {savedRoutines.map((routine) => {
              const count = getExerciseCount(routine);
              return (
                <button
                  key={routine.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() => {
                    // Workout logging UI will be built next
                  }}
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
