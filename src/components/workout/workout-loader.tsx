"use client";

import { useEffect } from "react";
import { useWorkoutStore } from "@/stores/workout-store";
import type { ActiveWorkout } from "@/lib/types/database";

interface WorkoutLoaderProps {
  session: {
    id: string;
    user_id: string;
    template_id: string | null;
    status: "in_progress" | "paused" | "completed" | "cancelled";
    started_at: string;
    paused_at: string | null;
    completed_at: string | null;
    notes: string | null;
    workout_session_exercises?: {
      id: string;
      exercise_id: string;
      sort_order: number;
      exercises: {
        id: string;
        name: string;
        muscle_group: string;
        equipment_type: string;
      } | null;
      sets: {
        id: string;
        set_number: number;
        weight: number | null;
        reps: number | null;
        notes: string | null;
        is_warmup: boolean;
        completed_at: string;
      }[];
    }[];
  };
}

export function WorkoutLoader({ session }: WorkoutLoaderProps) {
  const workout = useWorkoutStore((s) => s.workout);
  const loadWorkout = useWorkoutStore((s) => s.loadWorkout);

  useEffect(() => {
    if (workout?.id === session.id) return;

    const activeWorkout: ActiveWorkout = {
      id: session.id,
      userId: session.user_id,
      templateId: session.template_id,
      status: session.status,
      startedAt: session.started_at,
      pausedAt: session.paused_at,
      completedAt: session.completed_at,
      notes: session.notes,
      exercises: (session.workout_session_exercises ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((entry) => ({
          id: entry.id,
          exerciseId: entry.exercise_id,
          exerciseName: entry.exercises?.name ?? "Unknown",
          muscleGroup: (entry.exercises?.muscle_group ?? "full_body") as ActiveWorkout["exercises"][0]["muscleGroup"],
          equipmentType: (entry.exercises?.equipment_type ?? "other") as ActiveWorkout["exercises"][0]["equipmentType"],
          sortOrder: entry.sort_order,
          sets: (entry.sets ?? [])
            .sort((a, b) => a.set_number - b.set_number)
            .map((s) => ({
              id: s.id,
              setNumber: s.set_number,
              weight: s.weight != null ? Number(s.weight) : null,
              reps: s.reps,
              notes: s.notes,
              isWarmup: s.is_warmup,
              completedAt: s.completed_at,
            })),
        })),
    };

    if (activeWorkout.exercises.length === 0) {
      activeWorkout.exercises = [];
    }

    useWorkoutStore.setState({ workout: activeWorkout });
    loadWorkout(session.user_id);
  }, [session, workout?.id, loadWorkout]);

  return null;
}
