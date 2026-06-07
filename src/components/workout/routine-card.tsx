"use client";

import Link from "next/link";
import { ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatWorkoutDate } from "@/lib/workout-utils";
import type { Exercise, ExerciseSetDefaults } from "@/lib/types/database";

interface RoutineCardProps {
  template: {
    id: string;
    name: string;
    workout_template_exercises?: {
      sort_order: number;
      exercises: Exercise | null;
    }[];
  };
  lastPerformed: string | null;
  defaults: Record<string, ExerciseSetDefaults>;
  loading: boolean;
  onStart: () => void;
}

export function RoutineCard({
  template,
  lastPerformed,
  defaults,
  loading,
  onStart,
}: RoutineCardProps) {
  const exercises = (template.workout_template_exercises ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => entry.exercises)
    .filter((exercise): exercise is Exercise => exercise !== null);

  const hasDefaults = Object.keys(defaults).length > 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{template.name}</p>
              <p className="text-sm text-muted-foreground">
                {exercises.length} exercise{exercises.length === 1 ? "" : "s"}
                {lastPerformed && ` · Last done ${formatWorkoutDate(lastPerformed)}`}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
          </div>

          {exercises.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {exercises.slice(0, 4).map((exercise, index) => {
                const last = defaults[exercise.id];
                return (
                  <li key={exercise.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {index + 1}. {exercise.name}
                    </span>
                    {last?.reps != null && last?.weight != null && (
                      <span className="shrink-0 tabular-nums text-xs">
                        {last.reps} × {last.weight} lbs
                      </span>
                    )}
                  </li>
                );
              })}
              {exercises.length > 4 && (
                <li className="text-xs">+{exercises.length - 4} more</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-amber-600">
              No exercises in this routine yet.{" "}
              <Link href={`/templates/${template.id}`} className="underline">
                Add exercises
              </Link>
            </p>
          )}

          {hasDefaults && exercises.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Weight and reps will prefill from your last workout.
            </p>
          )}
        </div>

        <div className="border-t bg-muted/30 px-4 py-3">
          <Button
            className="h-11 w-full"
            disabled={loading || exercises.length === 0}
            onClick={onStart}
          >
            Start {template.name}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
