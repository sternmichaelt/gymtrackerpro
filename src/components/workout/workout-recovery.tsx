"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkoutStore } from "@/stores/workout-store";

export function WorkoutRecovery() {
  const init = useWorkoutStore((s) => s.init);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) init(user.id);
    });
  }, [init]);

  return null;
}
