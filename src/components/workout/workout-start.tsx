"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  LayoutList,
  Pause,
  Play,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { SyncIndicator } from "@/components/layout/sync-indicator";
import { WorkoutSchedule } from "@/components/workout/workout-schedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSavedRoutines } from "@/hooks/use-saved-routines";
import { cn } from "@/lib/utils";
import {
  countCompletedExercises,
  formatElapsedTime,
} from "@/lib/workout-utils";
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
  const router = useRouter();
  const [step, setStep] = useState<Step>("menu");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState("0:00");
  const init = useWorkoutStore((s) => s.init);
  const workout = useWorkoutStore((s) => s.workout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const pauseWorkout = useWorkoutStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutStore((s) => s.resumeWorkout);
  const endWorkout = useWorkoutStore((s) => s.endWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  const { routines, loading } = useSavedRoutines(userId, templates);
  const savedRoutines = routines.length > 0 ? routines : templates;

  const isActive =
    workout?.status === "in_progress" || workout?.status === "paused";

  useEffect(() => {
    init(userId);
  }, [init, userId]);

  useEffect(() => {
    if (isActive && workout?.templateId) {
      setStep("routines");
      setSelectedRoutineId(workout.templateId);
    }
  }, [isActive, workout?.templateId]);

  useEffect(() => {
    if (!workout || !isActive) return;
    const tick = () =>
      setElapsed(formatElapsedTime(workout.startedAt, workout.pausedAt));
    tick();
    if (workout.status === "paused") return;
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [workout, isActive]);

  const selectedRoutine = selectedRoutineId
    ? savedRoutines.find((routine) => routine.id === selectedRoutineId)
    : null;
  const selectedExercises = getTemplateExercises(selectedRoutine ?? undefined);
  const completedCount = workout ? countCompletedExercises(workout.exercises) : 0;
  const allComplete =
    !!workout &&
    workout.exercises.length > 0 &&
    completedCount === workout.exercises.length;

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

  const handleEnd = async () => {
    setSaving(true);
    try {
      const sessionId = await endWorkout();
      if (!sessionId) {
        toast.error("Could not save workout");
        return;
      }
      setShowEndDialog(false);
      setStep("menu");
      setSelectedRoutineId(null);
      router.push(`/workouts?saved=${sessionId}`);
      router.refresh();
    } catch {
      toast.error("Could not save workout");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    await cancelWorkout();
    toast.success("Workout cancelled");
    setShowCancelDialog(false);
    setStep("menu");
    setSelectedRoutineId(null);
    router.refresh();
  };

  if (step === "routines") {
    return (
      <div className="space-y-4">
        {!isActive && (
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
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {isActive ? "Workout in Progress" : "Choose a Routine"}
            </h1>
            <p className="text-muted-foreground">
              {isActive
                ? selectedRoutine?.name ?? workout?.templateName ?? "Your workout"
                : "Select one of your saved routines"}
            </p>
          </div>
          {isActive && (
            <div className="flex items-center gap-1">
              <Badge variant={workout?.status === "paused" ? "secondary" : "default"}>
                {workout?.status === "paused" ? "Paused" : "In Progress"}
              </Badge>
              <span className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {elapsed}
              </span>
              <SyncIndicator />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCancelDialog(true)}
                aria-label="Cancel workout"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
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
            {!isActive && (
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
            )}

            {(selectedRoutine || isActive) && (
              <section className="space-y-3 border-t pt-4">
                {selectedRoutine && !isActive && (
                  <div>
                    <h2 className="text-lg font-semibold">{selectedRoutine.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedExercises.length} exercise
                      {selectedExercises.length === 1 ? "" : "s"} in this workout
                    </p>
                  </div>
                )}

                {isActive ? (
                  <>
                    <WorkoutSchedule />
                    <div className="sticky bottom-20 space-y-2 rounded-xl border bg-background/95 p-4 backdrop-blur">
                      <Button
                        size="lg"
                        className="h-14 w-full text-base"
                        disabled={!allComplete}
                        onClick={() => setShowEndDialog(true)}
                      >
                        <Check className="mr-2 h-5 w-5" />
                        Complete Workout
                      </Button>
                      {!allComplete && workout && workout.exercises.length > 0 && (
                        <p className="text-center text-xs text-muted-foreground">
                          Check off all {workout.exercises.length} exercises to save (
                          {completedCount} done)
                        </p>
                      )}
                      <div className="flex justify-center pt-1">
                        {workout?.status === "paused" ? (
                          <Button size="sm" variant="outline" onClick={resumeWorkout}>
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            Resume
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={pauseWorkout}>
                            <Pause className="mr-1.5 h-3.5 w-3.5" />
                            Pause
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : selectedRoutine && selectedExercises.length === 0 ? (
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
                ) : selectedRoutine ? (
                  <>
                    <ul className="space-y-2">
                      {selectedExercises.map((exercise, index) => {
                        const last =
                          routineDefaults[selectedRoutine.id]?.[exercise.id];
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
                    <Button
                      className="h-12 w-full"
                      disabled={starting || selectedExercises.length === 0}
                      onClick={handleStartRoutine}
                    >
                      {starting ? "Starting..." : `Start ${selectedRoutine.name}`}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </section>
            )}
          </>
        )}

        <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save this workout?</DialogTitle>
              <DialogDescription>
                {completedCount} exercises logged. This will be added to your history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowEndDialog(false)}>
                Keep Going
              </Button>
              <Button onClick={handleEnd} disabled={saving}>
                {saving ? "Saving..." : "Save Workout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel workout?</DialogTitle>
              <DialogDescription>
                Your progress will be discarded and this workout won&apos;t be saved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Going
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel Workout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
