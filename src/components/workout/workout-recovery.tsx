"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkoutStore } from "@/stores/workout-store";

export function WorkoutRecovery() {
  const init = useWorkoutStore((s) => s.init);
  const workout = useWorkoutStore((s) => s.workout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) init(user.id);
    });
  }, [init]);

  useEffect(() => {
    if (
      workout?.status === "in_progress" ||
      workout?.status === "paused"
    ) {
      cancelWorkout();
    }
  }, [workout?.status, cancelWorkout]);

  return null;
}
