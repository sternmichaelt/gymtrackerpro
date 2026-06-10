"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Dumbbell,
  LayoutList,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { CurrentWorkoutSection } from "@/components/workout/current-workout-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSavedRoutines } from "@/hooks/use-saved-routines";
import { cn } from "@/lib/utils";
import type { SavedRoutine } from "@/lib/queries/templates-client";
import type { Exercise, ExerciseSetDefaults } from "@/lib/types/database";

type PickerMode = "menu" | "routines" | "exercise";

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
  const [startOpen, setStartOpen] = useState(true);
  const [pickerMode, setPickerMode] = useState<PickerMode>("menu");
  const [previewRoutineId, setPreviewRoutineId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const init = useWorkoutStore((s) => s.init);
  const workout = useWorkoutStore((s) => s.workout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const { routines, loading } = useSavedRoutines(userId, templates);
  const savedRoutines = routines.length > 0 ? routines : templates;

  const previewRoutine = previewRoutineId
    ? savedRoutines.find((routine) => routine.id === previewRoutineId)
    : null;
  const previewExercises = getTemplateExercises(previewRoutine ?? undefined);

  useEffect(() => {
    init(userId);
  }, [init, userId]);

  const returnToLanding = () => {
    setPreviewRoutineId(null);
    setPickerMode("menu");
    setStartOpen(false);
  };

  const handleStartWorkout = async () => {
    if (!previewRoutine) return;

    const exercises = getTemplateExercises(previewRoutine);
    if (exercises.length === 0) {
      toast.error("Add exercises to this routine first");
      return;
    }

    setStarting(true);
    try {
      await startWorkout(
        userId,
        exercises,
        previewRoutine.id,
        routineDefaults[previewRoutine.id] ?? {},
        previewRoutine.name
      );
      returnToLanding();
    } catch {
      toast.error("Could not start workout");
    } finally {
      setStarting(false);
    }
  };

  const startSummary =
    workout?.templateName ??
    (pickerMode === "routines"
      ? previewRoutine?.name ?? "Choosing a routine"
      : pickerMode === "exercise"
        ? "Single exercise"
        : "Pick how to start");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-muted-foreground">Start a workout and track your sets below.</p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/50"
          onClick={() => setStartOpen((open) => !open)}
          aria-expanded={startOpen}
        >
          <div className="min-w-0">
            <p className="font-semibold">Start Workout</p>
            <p className="truncate text-sm text-muted-foreground">{startSummary}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              startOpen && "rotate-180"
            )}
          />
        </button>

        {startOpen && (
          <div className="space-y-4 border-t px-4 pb-4 pt-3">
            {pickerMode === "routines" ? (
              previewRoutine ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-2 shrink-0"
                      onClick={() => setPreviewRoutineId(null)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={starting || previewExercises.length === 0}
                      onClick={handleStartWorkout}
                    >
                      {starting ? "Starting..." : "Start Workout"}
                    </Button>
                  </div>

                  <div>
                    <p className="font-medium">{previewRoutine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {previewExercises.length} exercise
                      {previewExercises.length === 1 ? "" : "s"} in this routine
                    </p>
                  </div>

                  {previewExercises.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        No exercises in this routine yet.{" "}
                        <Link
                          href={`/templates/${previewRoutine.id}`}
                          className="text-primary underline"
                        >
                          Add exercises
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <ul className="space-y-2">
                      {previewExercises.map((exercise, index) => {
                        const last =
                          routineDefaults[previewRoutine.id]?.[exercise.id];
                        return (
                          <li
                            key={exercise.id}
                            className="flex items-center justify-between gap-3 rounded-lg border p-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium">
                                {index + 1}. {exercise.name}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="secondary">
                                  {exercise.muscle_group}
                                </Badge>
                                <Badge variant="outline">
                                  {exercise.equipment_type}
                                </Badge>
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
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2"
                    onClick={() => setPickerMode("menu")}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>

                  <div>
                    <p className="font-medium">Choose a Routine</p>
                    <p className="text-sm text-muted-foreground">
                      Tap a routine to preview its exercises
                    </p>
                  </div>

                  {loading && savedRoutines.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Loading routines...
                    </p>
                  ) : savedRoutines.length === 0 ? (
                    <div className="space-y-3 py-6 text-center">
                      <p className="text-sm text-muted-foreground">No saved routines yet</p>
                      <Button asChild size="sm">
                        <Link href="/templates/new">Create a Routine</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedRoutines.map((routine) => {
                        const count = getExerciseCount(routine);
                        const isActive = workout?.templateId === routine.id;
                        return (
                          <button
                            key={routine.id}
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                              isActive && "border-primary bg-primary/5"
                            )}
                            onClick={() => setPreviewRoutineId(routine.id)}
                          >
                            <div className="min-w-0">
                              <p className="font-medium">{routine.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {count} exercise{count === 1 ? "" : "s"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            ) : pickerMode === "exercise" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2"
                  onClick={() => setPickerMode("menu")}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div>
                  <p className="font-medium">Add Single Exercise</p>
                  <p className="text-sm text-muted-foreground">
                    Exercise picker coming next
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setPickerMode("routines")}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LayoutList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Start Workout with a Routine</p>
                    <p className="text-sm text-muted-foreground">
                      Preview a routine and load its exercises
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setPickerMode("exercise")}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Single Exercise</p>
                    <p className="text-sm text-muted-foreground">
                      Add one exercise to today&apos;s workout
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <CurrentWorkoutSection />
    </div>
  );
}
