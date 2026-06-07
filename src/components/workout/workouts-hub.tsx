"use client";

import { WorkoutStart } from "@/components/workout/workout-start";
import type { SavedRoutine } from "@/lib/queries/templates-client";

interface WorkoutsHubProps {
  userId: string;
  templates: SavedRoutine[];
}

export function WorkoutsHub({ userId, templates }: WorkoutsHubProps) {
  return <WorkoutStart userId={userId} templates={templates} />;
}
