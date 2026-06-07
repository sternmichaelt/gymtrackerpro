"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Exercise } from "@/lib/types/database";

interface Template {
  id: string;
  name: string;
  workout_template_exercises?: {
    sort_order: number;
    exercises: Exercise | null;
  }[];
}

interface StartWorkoutFormProps {
  templates: Template[];
  userId: string;
}

export function StartWorkoutForm({ templates, userId }: StartWorkoutFormProps) {
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const [loading, setLoading] = useState(false);

  const handleStart = async (template?: Template) => {
    setLoading(true);
    try {
      const exercises =
        template?.workout_template_exercises
          ?.sort((a, b) => a.sort_order - b.sort_order)
          .map((te) => te.exercises)
          .filter((e): e is Exercise => e !== null) ?? [];

      const sessionId = await startWorkout(userId, exercises, template?.id ?? null);
      router.push(`/workouts/${sessionId}`);
    } catch {
      toast.error("Failed to start workout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        className="h-14 w-full"
        onClick={() => handleStart()}
        disabled={loading}
      >
        Start Empty Workout
      </Button>

      {templates.length > 0 && (
        <>
          <p className="text-sm font-medium text-muted-foreground">From template</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => !loading && handleStart(template)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.workout_template_exercises?.length ?? 0} exercises
                    </p>
                  </div>
                  <Button size="sm" disabled={loading}>
                    Start
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
