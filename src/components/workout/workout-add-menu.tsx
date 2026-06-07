"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Dumbbell, LayoutList, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useWorkoutStore } from "@/stores/workout-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { Exercise, ExerciseSetDefaults } from "@/lib/types/database";

type View = "menu" | "routine" | "exercise";

interface RoutineOption {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface WorkoutAddMenuProps {
  trigger: React.ReactElement;
}

async function fetchRoutines(userId: string): Promise<RoutineOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(`
      id,
      name,
      workout_template_exercises (
        sort_order,
        exercises (*)
      )
    `)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((template) => {
    const entries = (template.workout_template_exercises ?? []) as {
      sort_order: number;
      exercises: Exercise | Exercise[] | null;
    }[];

    const exercises = entries
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((entry) => {
        if (!entry.exercises) return [];
        return Array.isArray(entry.exercises) ? entry.exercises : [entry.exercises];
      });

    return { id: template.id, name: template.name, exercises };
  });
}

async function fetchRoutineDefaults(
  userId: string,
  templateId: string
): Promise<Record<string, ExerciseSetDefaults>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(`
      workout_session_exercises (
        exercise_id,
        sets (weight, reps, set_number)
      )
    `)
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const defaults: Record<string, ExerciseSetDefaults> = {};

  for (const entry of data?.workout_session_exercises ?? []) {
    const sets = [...(entry.sets ?? [])].sort(
      (a: { set_number: number }, b: { set_number: number }) =>
        b.set_number - a.set_number
    );
    const lastSet =
      sets.find(
        (set: { weight: number | null; reps: number | null }) =>
          set.weight != null || set.reps != null
      ) ?? sets[0];

    if (lastSet) {
      defaults[entry.exercise_id] = {
        weight: lastSet.weight != null ? Number(lastSet.weight) : null,
        reps: lastSet.reps,
      };
    }
  }

  return defaults;
}

export function WorkoutAddMenu({ trigger }: WorkoutAddMenuProps) {
  const workout = useWorkoutStore((s) => s.workout);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addExercises = useWorkoutStore((s) => s.addExercises);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [addingRoutineId, setAddingRoutineId] = useState<string | null>(null);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (!open) {
      setView("menu");
      setSearch("");
      setMuscleFilter(null);
      return;
    }

    if (view === "routine" && workout) {
      setLoadingRoutines(true);
      fetchRoutines(workout.userId)
        .then(setRoutines)
        .finally(() => setLoadingRoutines(false));
    }
  }, [open, view, workout]);

  useEffect(() => {
    if (!open || view !== "exercise") return;

    setLoadingExercises(true);
    const supabase = createClient();
    let query = supabase
      .from("exercises")
      .select("*")
      .eq("is_archived", false)
      .order("name");

    if (search) query = query.ilike("name", `%${search}%`);
    if (muscleFilter) query = query.eq("muscle_group", muscleFilter);

    query.then(({ data }) => {
      setExercises((data as Exercise[]) ?? []);
      setLoadingExercises(false);
    });
  }, [open, view, search, muscleFilter]);

  const close = () => setOpen(false);

  const handleAddRoutine = async (routine: RoutineOption) => {
    if (!workout || routine.exercises.length === 0) {
      toast.error("This routine has no exercises");
      return;
    }

    setAddingRoutineId(routine.id);
    try {
      const defaults = await fetchRoutineDefaults(workout.userId, routine.id);
      const added = await addExercises(routine.exercises, defaults);

      if (added === 0) {
        toast.info("All exercises from this routine are already in your workout");
      } else {
        toast.success(`Added ${added} exercise${added === 1 ? "" : "s"} from ${routine.name}`);
        close();
      }
    } catch {
      toast.error("Failed to add routine");
    } finally {
      setAddingRoutineId(null);
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!workout) {
      toast.error("No active workout found");
      return;
    }

    try {
      const added = await addExercises([exercise]);
      if (added === 0) {
        toast.info(`${exercise.name} is already in your workout`);
        return;
      }
      toast.success(`Added ${exercise.name}`);
      close();
    } catch {
      toast.error("Failed to add exercise");
    }
  };

  const title =
    view === "menu"
      ? "Add to Workout"
      : view === "routine"
        ? "Add Saved Routine"
        : "Add Single Exercise";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} nativeButton={false} />
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {view !== "menu" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setView("menu")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle>{title}</SheetTitle>
          </div>
        </SheetHeader>

        {view === "menu" && (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => setView("routine")}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LayoutList className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Add Saved Routine</p>
                <p className="text-sm text-muted-foreground">
                  Add all exercises from one of your routines
                </p>
              </div>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => setView("exercise")}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Add Single Exercise</p>
                <p className="text-sm text-muted-foreground">
                  Pick one exercise to add to today&apos;s workout
                </p>
              </div>
            </button>
          </div>
        )}

        {view === "routine" && (
          <div className="mt-4 max-h-[65vh] space-y-2 overflow-y-auto">
            {loadingRoutines ? (
              <p className="py-8 text-center text-muted-foreground">Loading routines...</p>
            ) : routines.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No saved routines yet</p>
            ) : (
              routines.map((routine) => (
                <button
                  key={routine.id}
                  type="button"
                  disabled={addingRoutineId !== null}
                  className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  onClick={() => handleAddRoutine(routine)}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{routine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {routine.exercises.length} exercise
                      {routine.exercises.length === 1 ? "" : "s"}
                    </p>
                    {routine.exercises.length > 0 && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {routine.exercises
                          .slice(0, 3)
                          .map((exercise) => exercise.name)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}

        {view === "exercise" && (
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={muscleFilter === null ? "default" : "outline"}
                onClick={() => setMuscleFilter(null)}
              >
                All
              </Button>
              {MUSCLE_GROUPS.map((group) => (
                <Button
                  key={group.value}
                  size="sm"
                  variant={muscleFilter === group.value ? "default" : "outline"}
                  onClick={() => setMuscleFilter(group.value)}
                >
                  {group.label}
                </Button>
              ))}
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {loadingExercises ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : exercises.length === 0 ? (
                <p className="text-center text-muted-foreground">No exercises found</p>
              ) : (
                exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50"
                    onClick={() => handleAddExercise(exercise)}
                  >
                    <span className="font-medium">{exercise.name}</span>
                    <Badge variant="secondary">{exercise.muscle_group}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
