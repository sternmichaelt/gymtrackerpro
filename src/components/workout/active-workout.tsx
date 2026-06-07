"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { SyncIndicator } from "@/components/layout/sync-indicator";
import { RoutineSelector } from "@/components/workout/routine-selector";
import { WorkoutSchedule } from "@/components/workout/workout-schedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  countCompletedExercises,
  formatElapsedTime,
} from "@/lib/workout-utils";
import type { Exercise } from "@/lib/types/database";

interface RoutineTemplate {
  id: string;
  name: string;
  workout_template_exercises?: {
    sort_order: number;
    exercises: Exercise | null;
  }[];
}

interface ActiveWorkoutProps {
  templates?: RoutineTemplate[];
  onComplete?: () => void;
}

export function ActiveWorkout({ templates = [], onComplete }: ActiveWorkoutProps) {
  const router = useRouter();
  const workout = useWorkoutStore((s) => s.workout);
  const pauseWorkout = useWorkoutStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutStore((s) => s.resumeWorkout);
  const endWorkout = useWorkoutStore((s) => s.endWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState("0:00");

  useEffect(() => {
    if (!workout) return;
    const tick = () =>
      setElapsed(formatElapsedTime(workout.startedAt, workout.pausedAt));
    tick();
    if (workout.status === "paused") return;
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [workout]);

  if (!workout) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading workout...
      </div>
    );
  }

  const completedCount = countCompletedExercises(workout.exercises);
  const allComplete =
    workout.exercises.length > 0 && completedCount === workout.exercises.length;

  const handleEnd = async () => {
    setSaving(true);
    try {
      const sessionId = await endWorkout();
      if (!sessionId) {
        toast.error("Could not save workout");
        return;
      }
      setShowEndDialog(false);
      onComplete?.();
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
    onComplete?.();
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Active Workout</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={workout.status === "paused" ? "secondary" : "default"}>
                {workout.status === "paused" ? "Paused" : "In Progress"}
              </Badge>
              <span className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {elapsed}
              </span>
            </div>
          </div>
          <SyncIndicator />
        </div>

        <RoutineSelector
          templates={templates}
          value={workout.templateId}
          onSelect={() => {}}
          disabled
        />
      </div>

      <div className="flex gap-2">
        {workout.status === "paused" ? (
          <Button variant="outline" className="flex-1" onClick={resumeWorkout}>
            <Play className="mr-2 h-4 w-4" /> Resume
          </Button>
        ) : (
          <Button variant="outline" className="flex-1" onClick={pauseWorkout}>
            <Pause className="mr-2 h-4 w-4" /> Pause
          </Button>
        )}
        <Button variant="ghost" onClick={() => setShowCancelDialog(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

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
        {!allComplete && workout.exercises.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Check off all {workout.exercises.length} exercises to save ({completedCount} done)
          </p>
        )}
      </div>

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
