"use client";

import { totalVolume, workoutDurationMinutes } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkoutDetailProps {
  session: {
    id: string;
    started_at: string;
    completed_at: string | null;
    paused_at: string | null;
    notes: string | null;
    status: string;
    workout_session_exercises?: {
      id: string;
      sort_order: number;
      exercises: { id: string; name: string; muscle_group: string } | null;
      sets: { weight: number | null; reps: number | null; set_number: number }[];
    }[];
  };
}

export function WorkoutDetail({ session }: WorkoutDetailProps) {
  const exercises = (session.workout_session_exercises ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const allSets = exercises.flatMap((e) => e.sets ?? []);
  const volume = totalVolume(allSets);
  const duration = workoutDurationMinutes(
    session.started_at,
    session.completed_at,
    session.paused_at
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workout</h1>
        <p className="text-muted-foreground">
          {session.completed_at
            ? new Date(session.completed_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Session"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{volume.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Volume (lbs)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{duration}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {exercises.map((entry) => {
          const exercise = entry.exercises;
          if (!exercise) return null;
          const exVolume = totalVolume(entry.sets ?? []);

          return (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{exercise.name}</CardTitle>
                  <Badge variant="secondary">{exercise.muscle_group}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(entry.sets ?? [])
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div
                      key={set.set_number}
                      className="flex items-center gap-4 text-sm tabular-nums"
                    >
                      <span className="w-6 text-muted-foreground">{set.set_number}</span>
                      <span className="flex-1">{set.weight ?? "—"} lbs</span>
                      <span>{set.reps ?? "—"} reps</span>
                    </div>
                  ))}
                <p className="pt-1 text-xs text-muted-foreground">
                  {exVolume.toLocaleString()} lbs total
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
