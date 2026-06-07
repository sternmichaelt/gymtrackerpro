"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { SyncIndicator } from "@/components/layout/sync-indicator";
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

function isExerciseComplete(set: { weight: number | null; reps: number | null; completedAt: string | null }) {
  return set.completedAt != null && set.weight != null && set.reps != null;
}

export function ActiveWorkout() {
  const router = useRouter();
  const workout = useWorkoutStore((s) => s.workout);
  const pauseWorkout = useWorkoutStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutStore((s) => s.resumeWorkout);
  const endWorkout = useWorkoutStore((s) => s.endWorkout);
  const [showEndDialog, setShowEndDialog] = useState(false);

  if (!workout) return null;

  const completedCount = workout.exercises.filter((exercise) => {
    const set = exercise.sets[0];
    return set && isExerciseComplete(set);
  }).length;
  const allComplete =
    workout.exercises.length > 0 && completedCount === workout.exercises.length;

  const handleEnd = async () => {
    await endWorkout();
    toast.success("Workout completed!");
    router.push("/workouts");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {workout.templateName ?? "Active Workout"}
          </h1>
          <Badge variant={workout.status === "paused" ? "secondary" : "default"}>
            {workout.status === "paused" ? "Paused" : "In Progress"}
          </Badge>
        </div>
        <SyncIndicator />
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
      </div>

      <WorkoutSchedule />

      <Button
        size="lg"
        className="h-14 w-full"
        disabled={!allComplete}
        onClick={() => setShowEndDialog(true)}
      >
        <Check className="mr-2 h-5 w-5" />
        Complete Workout
      </Button>

      {!allComplete && workout.exercises.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Complete all exercises to finish your workout ({completedCount}/
          {workout.exercises.length})
        </p>
      )}

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete workout?</DialogTitle>
            <DialogDescription>
              Your workout will be saved to history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnd}>Complete Workout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
