"use client";

import { WorkoutStart } from "@/components/workout/workout-start";
import type { SavedRoutine } from "@/lib/queries/templates-client";
import type { ExerciseSetDefaults } from "@/lib/types/database";

interface WorkoutsHubProps {
  userId: string;
  templates: SavedRoutine[];
  routineDefaults?: Record<string, Record<string, ExerciseSetDefaults>>;
}

export function WorkoutsHub({
  userId,
  templates,
  routineDefaults = {},
}: WorkoutsHubProps) {
  return (
    <WorkoutStart
      userId={userId}
      templates={templates}
      routineDefaults={routineDefaults}
    />
  );
}
