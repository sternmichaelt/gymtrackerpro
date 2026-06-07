"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Square, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { SyncIndicator } from "@/components/layout/sync-indicator";
import { QuickLogPad } from "@/components/workout/quick-log-pad";
import { SetRow } from "@/components/workout/set-row";
import { ExercisePicker } from "@/components/workout/exercise-picker";
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
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const deleteSet = useWorkoutStore((s) => s.deleteSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const activeExercise = workout?.exercises.find((e) => e.id === activeExerciseId)
    ?? workout?.exercises[0];
  const activeSet = activeExercise?.sets.find((s) => s.id === activeSetId)
    ?? activeExercise?.sets[activeExercise.sets.length - 1];

  useEffect(() => {
    if (!activeExerciseId && activeExercise) {
      setActiveExerciseId(activeExercise.id);
      setActiveSetId(activeExercise.sets[activeExercise.sets.length - 1]?.id ?? null);
    }
  }, [activeExerciseId, activeExercise]);

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

      <div className="flex gap-2 overflow-x-auto pb-2">
        {workout.exercises.map((ex) => (
          <Button
            key={ex.id}
            size="sm"
            variant={activeExercise?.id === ex.id ? "default" : "outline"}
            onClick={() => {
              setActiveExerciseId(ex.id);
              setActiveSetId(ex.sets[ex.sets.length - 1]?.id ?? null);
            }}
          >
            {ex.exerciseName}
          </Button>
        ))}
        <ExercisePicker
          onSelect={addExercise}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {activeExercise && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activeExercise.exerciseName}</h2>
              <p className="text-sm text-muted-foreground">
                {activeExercise.muscleGroup} · {activeExercise.equipmentType}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeExercise(activeExercise.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {activeExercise.sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                isActive={set.id === activeSet?.id}
                onSelect={() => setActiveSetId(set.id)}
                onDelete={() => deleteSet(activeExercise.id, set.id)}
              />
            ))}
          </div>

          {activeSet && (
            <QuickLogPad
              weight={activeSet.weight}
              reps={activeSet.reps}
              onWeightChange={(w) =>
                updateSet(activeExercise.id, activeSet.id, { weight: w })
              }
              onRepsChange={(r) =>
                updateSet(activeExercise.id, activeSet.id, { reps: r })
              }
              onComplete={() => completeSet(activeExercise.id, activeSet.id)}
            />
          )}
        </div>
      )}

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
