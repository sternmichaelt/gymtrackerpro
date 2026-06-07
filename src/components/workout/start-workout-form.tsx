"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { RoutineSelector } from "@/components/workout/routine-selector";
import { useSavedRoutines } from "@/hooks/use-saved-routines";
import type { SavedRoutine } from "@/lib/queries/templates-client";
import type { Exercise, ExerciseSetDefaults } from "@/lib/types/database";

interface StartWorkoutFormProps {
  templates: SavedRoutine[];
  userId: string;
  routineDefaults: Record<string, Record<string, ExerciseSetDefaults>>;
}

function getTemplateExercises(template?: SavedRoutine) {
  return (
    template?.workout_template_exercises
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((entry) => entry.exercises)
      .filter((exercise): exercise is Exercise => exercise !== null) ?? []
  );
}

export function StartWorkoutForm({
  templates,
  userId,
  routineDefaults,
}: StartWorkoutFormProps) {
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const { routines, loading: loadingRoutines } = useSavedRoutines(userId, templates);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRoutineSelect = async (templateId: string | null) => {
    setSelectedId(templateId);

    const template = templateId
      ? routines.find((item) => item.id === templateId)
      : undefined;
    const exercises = getTemplateExercises(template);

    if (template && exercises.length === 0) {
      toast.error("Add exercises to this routine first");
      setSelectedId(null);
      return;
    }

    setLoading(true);
    try {
      await startWorkout(
        userId,
        exercises,
        template?.id ?? null,
        template ? routineDefaults[template.id] ?? {} : {},
        template?.name ?? null
      );
      router.push("/workouts");
    } catch {
      toast.error("Failed to start workout");
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <RoutineSelector
        routines={routines}
        value={selectedId}
        onSelect={handleRoutineSelect}
        loading={loading || loadingRoutines}
      />
      <p className="text-sm text-muted-foreground">
        Pick a routine to load your exercises and start logging.
      </p>
    </div>
  );
}
