"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useWorkoutStore } from "@/stores/workout-store";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { CompletedWorkoutsSection } from "@/components/workout/completed-workouts-section";
import { RoutineCard } from "@/components/workout/routine-card";
import { WorkoutLoader } from "@/components/workout/workout-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatWorkoutDate } from "@/lib/workout-utils";
import type { Exercise, ExerciseSetDefaults } from "@/lib/types/database";
import type { WorkoutLoaderProps } from "@/components/workout/workout-loader";

interface Template {
  id: string;
  name: string;
  workout_template_exercises?: {
    sort_order: number;
    exercises: Exercise | null;
  }[];
}

interface Session {
  id: string;
  completed_at: string | null;
  started_at: string;
  paused_at: string | null;
  exerciseCount: number;
  volume: number;
  routineName: string | null;
  exerciseNames: string[];
}

interface WorkoutsHubProps {
  userId: string;
  templates: Template[];
  sessions: Session[];
  routineDefaults: Record<string, Record<string, ExerciseSetDefaults>>;
  lastPerformed: Record<string, string | null>;
  stats: { weekCount: number; lastWorkoutDate: string | null };
  activeSession: WorkoutLoaderProps["session"] | null;
  activeDefaults: Record<string, ExerciseSetDefaults>;
}

export function WorkoutsHub({
  userId,
  templates,
  sessions,
  routineDefaults,
  lastPerformed,
  stats,
  activeSession,
  activeDefaults,
}: WorkoutsHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedWorkoutId = searchParams.get("saved");
  const init = useWorkoutStore((s) => s.init);
  const workout = useWorkoutStore((s) => s.workout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    init(userId);
  }, [init, userId]);

  const isActiveWorkout =
    workout?.status === "in_progress" || workout?.status === "paused";
  const isResuming = Boolean(activeSession) && !workout;

  const handleStart = async (template?: Template) => {
    setStarting(true);
    try {
      const exercises =
        template?.workout_template_exercises
          ?.sort((a, b) => a.sort_order - b.sort_order)
          .map((entry) => entry.exercises)
          .filter((exercise): exercise is Exercise => exercise !== null) ?? [];

      if (template && exercises.length === 0) {
        toast.error("Add exercises to this routine first");
        return;
      }

      await startWorkout(
        userId,
        exercises,
        template?.id ?? null,
        template ? routineDefaults[template.id] ?? {} : {},
        template?.name ?? null
      );
    } catch {
      toast.error("Failed to start workout");
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = () => {
    router.refresh();
  };

  useEffect(() => {
    if (!savedWorkoutId) return;
    toast.success("Workout saved!");
    const timer = window.setTimeout(() => {
      router.replace("/workouts");
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [savedWorkoutId, router]);

  if (isResuming) {
    return (
      <div className="space-y-4">
        {activeSession && (
          <WorkoutLoader session={activeSession} previousDefaults={activeDefaults} />
        )}
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading workout...
        </div>
      </div>
    );
  }

  if (isActiveWorkout) {
    return <ActiveWorkout onComplete={handleComplete} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-muted-foreground">Pick a routine and log your sets</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{stats.weekCount}</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <Calendar className="mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {stats.lastWorkoutDate
                ? formatWorkoutDate(stats.lastWorkoutDate)
                : "No workouts yet"}
            </p>
            <p className="text-xs text-muted-foreground">Last workout</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Start a Workout</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/templates">
              Manage
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((template) => (
              <RoutineCard
                key={template.id}
                template={template}
                lastPerformed={lastPerformed[template.id] ?? null}
                defaults={routineDefaults[template.id] ?? {}}
                loading={starting}
                onStart={() => handleStart(template)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-3 py-8 text-center">
              <p className="text-muted-foreground">No routines yet</p>
              <Button asChild>
                <Link href="/templates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Routine
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          className="h-12 w-full"
          disabled={starting}
          onClick={() => handleStart()}
        >
          Start Empty Workout
        </Button>
      </div>

      <CompletedWorkoutsSection
        sessions={sessions}
        highlightedId={savedWorkoutId}
      />

      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/exercises">Browse Exercises</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/history">View History</Link>
        </Button>
      </div>
    </div>
  );
}
