"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchSavedRoutines,
  type SavedRoutine,
} from "@/lib/queries/templates-client";

export function useSavedRoutines(userId: string, initial: SavedRoutine[] = []) {
  const [routines, setRoutines] = useState<SavedRoutine[]>(initial);
  const [loading, setLoading] = useState(initial.length === 0);

  const initialKey = initial.map((routine) => routine.id).join(",");

  useEffect(() => {
    if (initial.length > 0) {
      setRoutines(initial);
      setLoading(false);
    }
  }, [initial, initialKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSavedRoutines(userId);
      if (data.length > 0) {
        setRoutines(data);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { routines, loading, refresh };
}
