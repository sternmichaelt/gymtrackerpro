"use client";

import { Plus } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { ExerciseLogRow } from "@/components/workout/exercise-log-row";
import { WorkoutAddMenu } from "@/components/workout/workout-add-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getWorkoutProgress } from "@/lib/workout-utils";

export function WorkoutSchedule() {
  const workout = useWorkoutStore((s) => s.workout);
  const exercises = useWorkoutStore((s) => s.workout?.exercises ?? []);

  if (!workout) return null;

  const { completed, total, percent } = getWorkoutProgress(exercises);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {completed} of {total} exercises complete
          </span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No exercises in this workout yet.
            </p>
            <WorkoutAddMenu
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exercises
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[auto_1fr_3.5rem_4rem] gap-2 px-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[auto_1fr_4rem_4.5rem] sm:gap-3 sm:px-3">
            <span className="w-8 text-center">Done</span>
            <span>Exercise</span>
            <span className="text-center">Reps</span>
            <span className="text-center">lbs</span>
          </div>

          {exercises.map((exercise, index) => (
            <ExerciseLogRow key={exercise.id} exercise={exercise} index={index} />
          ))}

          <div className="flex justify-end pt-1">
            <WorkoutAddMenu
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Exercise
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
