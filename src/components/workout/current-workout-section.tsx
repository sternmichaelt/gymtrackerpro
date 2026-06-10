"use client";

import { useWorkoutStore } from "@/stores/workout-store";
import { WorkoutExerciseRow } from "@/components/workout/workout-exercise-row";
import { Card, CardContent } from "@/components/ui/card";
import { getWorkoutProgress } from "@/lib/workout-utils";

export function CurrentWorkoutSection() {
  const workout = useWorkoutStore((s) => s.workout);
  const exercises = workout?.exercises ?? [];

  if (!workout || exercises.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Current Workout</h2>
          <p className="text-sm text-muted-foreground">
            Choose a routine above to load your exercises here.
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No exercises loaded yet.
          </CardContent>
        </Card>
      </section>
    );
  }

  const { completed, total, percent } = getWorkoutProgress(exercises);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {workout.templateName ?? "Current Workout"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {completed} of {total} exercises complete · {percent}%
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-2">
        {exercises.map((exercise, index) => (
          <WorkoutExerciseRow key={exercise.id} exercise={exercise} index={index} />
        ))}
      </div>
    </section>
  );
}
