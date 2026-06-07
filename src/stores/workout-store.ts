"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  ActiveWorkout,
  ActiveWorkoutExercise,
  ActiveWorkoutSet,
  Exercise,
  ExerciseSetDefaults,
  SyncStatus,
} from "@/lib/types/database";
import { db } from "@/lib/offline/db";
import {
  flushQueue,
  initSyncEngine,
  isNetworkOnline,
  queueMutation,
  scheduleSync,
} from "@/lib/offline/sync-engine";

interface WorkoutStore {
  workout: ActiveWorkout | null;
  syncStatus: SyncStatus;
  initialized: boolean;
  init: (userId: string) => void;
  loadWorkout: (userId: string) => Promise<void>;
  startWorkout: (
    userId: string,
    exercises?: Exercise[],
    templateId?: string | null,
    defaults?: Record<string, ExerciseSetDefaults>,
    templateName?: string | null
  ) => Promise<string>;
  pauseWorkout: () => Promise<void>;
  resumeWorkout: () => Promise<void>;
  endWorkout: () => Promise<string | null>;
  cancelWorkout: () => Promise<void>;
  addExercise: (exercise: Exercise) => Promise<void>;
  addExercises: (
    exercises: Exercise[],
    defaults?: Record<string, ExerciseSetDefaults>
  ) => Promise<number>;
  removeExercise: (exerciseEntryId: string) => Promise<void>;
  addSet: (exerciseEntryId: string) => Promise<void>;
  updateSet: (
    exerciseEntryId: string,
    setId: string,
    updates: Partial<Pick<ActiveWorkoutSet, "weight" | "reps" | "notes" | "isWarmup" | "completedAt">>
  ) => Promise<void>;
  deleteSet: (exerciseEntryId: string, setId: string) => Promise<void>;
  completeSet: (exerciseEntryId: string, setId: string) => Promise<void>;
}

async function persistWorkout(workout: ActiveWorkout) {
  await db.activeWorkout.put(workout);
}

async function syncSession(workout: ActiveWorkout) {
  await queueMutation("workout_sessions", "upsert", {
    id: workout.id,
    user_id: workout.userId,
    template_id: workout.templateId,
    status: workout.status,
    started_at: workout.startedAt,
    paused_at: workout.pausedAt,
    completed_at: workout.completedAt,
    notes: workout.notes,
  });
}

async function syncExerciseEntry(
  sessionId: string,
  entry: ActiveWorkoutExercise
) {
  await queueMutation("workout_session_exercises", "upsert", {
    id: entry.id,
    session_id: sessionId,
    exercise_id: entry.exerciseId,
    sort_order: entry.sortOrder,
  });
}

async function syncSet(entryId: string, set: ActiveWorkoutSet) {
  await queueMutation("sets", "upsert", {
    id: set.id,
    workout_session_exercise_id: entryId,
    set_number: set.setNumber,
    weight: set.weight,
    reps: set.reps,
    notes: set.notes,
    is_warmup: set.isWarmup,
    completed_at: set.completedAt,
  });
}

async function syncFullWorkout(workout: ActiveWorkout) {
  await syncSession(workout);
  for (const entry of workout.exercises) {
    await syncExerciseEntry(workout.id, entry);
    for (const set of entry.sets) {
      await syncSet(entry.id, set);
    }
  }
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  workout: null,
  syncStatus: "saved",
  initialized: false,

  init: (userId) => {
    if (get().initialized) return;
    initSyncEngine((online) => {
      set({ syncStatus: online ? "saved" : "offline" });
      if (online) {
        set({ syncStatus: "saving" });
        flushQueue().then((ok) =>
          set({ syncStatus: ok ? "saved" : "error" })
        );
      }
    });
    get().loadWorkout(userId);
    set({ initialized: true });
  },

  loadWorkout: async (userId) => {
    const { workout: current } = get();
    if (
      current?.userId === userId &&
      (current.status === "in_progress" || current.status === "paused")
    ) {
      return;
    }

    const local = await db.activeWorkout.toArray();
    const active = local.find(
      (w) =>
        w.userId === userId &&
        (w.status === "in_progress" || w.status === "paused")
    );
    if (active) set({ workout: active });
  },

  startWorkout: async (
    userId,
    exercises = [],
    templateId = null,
    defaults = {},
    templateName = null
  ) => {
    const sessionId = uuidv4();
    const workout: ActiveWorkout = {
      id: sessionId,
      userId,
      templateId,
      templateName,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      pausedAt: null,
      completedAt: null,
      notes: null,
      exercises: exercises.map((ex, i) => {
        const previous = defaults[ex.id];
        return {
          id: uuidv4(),
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscle_group,
          equipmentType: ex.equipment_type,
          sortOrder: i,
          previousWeight: previous?.weight ?? null,
          previousReps: previous?.reps ?? null,
          sets: [
            {
              id: uuidv4(),
              setNumber: 1,
              weight: previous?.weight ?? null,
              reps: previous?.reps ?? null,
              notes: null,
              isWarmup: false,
              completedAt: null,
            },
          ],
        };
      }),
    };

    await persistWorkout(workout);
    set({ workout, syncStatus: "saving" });
    await syncSession(workout);
    for (const entry of workout.exercises) {
      await syncExerciseEntry(sessionId, entry);
      for (const s of entry.sets) await syncSet(entry.id, s);
    }
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
    return sessionId;
  },

  pauseWorkout: async () => {
    const { workout } = get();
    if (!workout) return;
    const updated = {
      ...workout,
      status: "paused" as const,
      pausedAt: new Date().toISOString(),
    };
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    await syncSession(updated);
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  resumeWorkout: async () => {
    const { workout } = get();
    if (!workout) return;
    const updated = {
      ...workout,
      status: "in_progress" as const,
      pausedAt: null,
    };
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    await syncSession(updated);
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  endWorkout: async () => {
    const { workout } = get();
    if (!workout) return null;

    const completedAt = new Date().toISOString();
    const updated = {
      ...workout,
      status: "completed" as const,
      completedAt,
      exercises: workout.exercises.map((entry) => ({
        ...entry,
        sets: entry.sets.map((set) => ({
          ...set,
          completedAt: set.completedAt ?? completedAt,
        })),
      })),
    };

    set({ workout: updated, syncStatus: "saving" });
    await persistWorkout(updated);
    await syncFullWorkout(updated);

    const synced = isNetworkOnline() ? await flushQueue() : false;

    await db.activeWorkout.delete(workout.id);
    set({
      workout: null,
      syncStatus: synced || !isNetworkOnline() ? "saved" : "error",
    });

    return workout.id;
  },

  cancelWorkout: async () => {
    const { workout } = get();
    if (!workout) return;
    const updated = {
      ...workout,
      status: "cancelled" as const,
      completedAt: new Date().toISOString(),
    };
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    await syncSession(updated);
    scheduleSync();
    await db.activeWorkout.delete(workout.id);
    set({ workout: null, syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  addExercise: async (exercise) => {
    await get().addExercises([exercise]);
  },

  addExercises: async (exercises, defaults = {}) => {
    const { workout } = get();
    if (!workout) return 0;

    const existingIds = new Set(workout.exercises.map((entry) => entry.exerciseId));
    const newEntries: ActiveWorkoutExercise[] = [];

    for (const exercise of exercises) {
      if (existingIds.has(exercise.id)) continue;

      const previous = defaults[exercise.id];
      newEntries.push({
        id: uuidv4(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscle_group,
        equipmentType: exercise.equipment_type,
        sortOrder: workout.exercises.length + newEntries.length,
        previousWeight: previous?.weight ?? null,
        previousReps: previous?.reps ?? null,
        sets: [
          {
            id: uuidv4(),
            setNumber: 1,
            weight: previous?.weight ?? null,
            reps: previous?.reps ?? null,
            notes: null,
            isWarmup: false,
            completedAt: null,
          },
        ],
      });
      existingIds.add(exercise.id);
    }

    if (newEntries.length === 0) return 0;

    const updated = {
      ...workout,
      exercises: [...workout.exercises, ...newEntries],
    };

    set({ workout: updated, syncStatus: "saving" });
    await persistWorkout(updated);

    for (const entry of newEntries) {
      await syncExerciseEntry(workout.id, entry);
      for (const set of entry.sets) await syncSet(entry.id, set);
    }

    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
    return newEntries.length;
  },

  removeExercise: async (exerciseEntryId) => {
    const { workout } = get();
    if (!workout) return;
    const updated = {
      ...workout,
      exercises: workout.exercises.filter((e) => e.id !== exerciseEntryId),
    };
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    await queueMutation("workout_session_exercises", "delete", {
      id: exerciseEntryId,
    });
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  addSet: async (exerciseEntryId) => {
    const { workout } = get();
    if (!workout) return;
    const entry = workout.exercises.find((e) => e.id === exerciseEntryId);
    if (!entry) return;
    const lastSet = entry.sets[entry.sets.length - 1];
    const newSet: ActiveWorkoutSet = {
      id: uuidv4(),
      setNumber: entry.sets.length + 1,
      weight: lastSet?.weight ?? null,
      reps: lastSet?.reps ?? null,
      notes: null,
      isWarmup: false,
      completedAt: null,
    };
    const updated = {
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === exerciseEntryId ? { ...e, sets: [...e.sets, newSet] } : e
      ),
    };
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    await syncSet(exerciseEntryId, newSet);
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  updateSet: async (exerciseEntryId, setId, updates) => {
    const { workout } = get();
    if (!workout) return;
    const updated = {
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === exerciseEntryId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, ...updates } : s
              ),
            }
          : e
      ),
    };
    const entry = updated.exercises.find((e) => e.id === exerciseEntryId);
    const setData = entry?.sets.find((s) => s.id === setId);
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    if (setData) await syncSet(exerciseEntryId, setData);
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  deleteSet: async (exerciseEntryId, setId) => {
    const { workout } = get();
    if (!workout) return;
    const updated = {
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === exerciseEntryId
          ? {
              ...e,
              sets: e.sets
                .filter((s) => s.id !== setId)
                .map((s, i) => ({ ...s, setNumber: i + 1 })),
            }
          : e
      ),
    };
    await persistWorkout(updated);
    set({ workout: updated, syncStatus: "saving" });
    await queueMutation("sets", "delete", { id: setId });
    scheduleSync();
    set({ syncStatus: isNetworkOnline() ? "saved" : "offline" });
  },

  completeSet: async (exerciseEntryId, setId) => {
    const { workout } = get();
    if (!workout) return;
    const entry = workout.exercises.find((e) => e.id === exerciseEntryId);
    const set = entry?.sets.find((s) => s.id === setId);
    if (!set || set.weight == null || set.reps == null) return;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    await get().updateSet(exerciseEntryId, setId, {
      completedAt: new Date().toISOString(),
    });
  },
}));
