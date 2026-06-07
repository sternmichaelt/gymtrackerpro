"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Square } from "lucide-react";
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

export function ActiveWorkout() {
  const router = useRouter();
  const workout = useWorkoutStore((s) => s.workout);
  const pauseWorkout = useWorkoutStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutStore((s) => s.resumeWorkout);
  const endWorkout = useWorkoutStore((s) => s.endWorkout);
  const [showEndDialog, setShowEndDialog] = useState(false);

  if (!workout) return null;

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
          <h1 className="text-xl font-bold">Active Workout</h1>
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
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => setShowEndDialog(true)}
        >
          <Square className="mr-2 h-4 w-4" /> End
        </Button>
      </div>

      <WorkoutSchedule />

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End workout?</DialogTitle>
            <DialogDescription>
              This will save your workout to history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnd}>End Workout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
