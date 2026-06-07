"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatWorkoutDate } from "@/lib/workout-utils";
import { workoutDurationMinutes } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CompletedSession {
  id: string;
  completed_at: string | null;
  started_at: string;
  paused_at: string | null;
  exerciseCount: number;
  volume: number;
  routineName: string | null;
  exerciseNames: string[];
}

interface CompletedWorkoutsSectionProps {
  sessions: CompletedSession[];
  highlightedId?: string | null;
}

export function CompletedWorkoutsSection({
  sessions,
  highlightedId,
}: CompletedWorkoutsSectionProps) {
  const orderedSessions = highlightedId
    ? [
        ...sessions.filter((session) => session.id === highlightedId),
        ...sessions.filter((session) => session.id !== highlightedId),
      ]
    : sessions;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Completed Workouts</h2>
        {sessions.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/history">See all</Link>
          </Button>
        )}
      </div>

      {highlightedId && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-2 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span>Workout saved! It&apos;s listed below.</span>
          </CardContent>
        </Card>
      )}

      {orderedSessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Finished workouts will appear here automatically.
          </CardContent>
        </Card>
      ) : (
        orderedSessions.slice(0, 10).map((session) => {
          const isHighlighted = session.id === highlightedId;
          return (
            <Link key={session.id} href={`/workouts/${session.id}`}>
              <Card
                className={cn(
                  "transition-colors hover:bg-muted/50",
                  isHighlighted && "border-primary/50 bg-primary/5"
                )}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {session.routineName ?? "Workout"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.completed_at
                          ? formatWorkoutDate(session.completed_at)
                          : "Completed"}{" "}
                        · {session.exerciseCount} exercises ·{" "}
                        {workoutDurationMinutes(
                          session.started_at,
                          session.completed_at,
                          session.paused_at
                        )}{" "}
                        min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {session.volume.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">lbs</p>
                    </div>
                  </div>
                  {session.exerciseNames.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {session.exerciseNames.slice(0, 4).join(" · ")}
                      {session.exerciseNames.length > 4 && " · …"}
                    </p>
                  )}
                  {isHighlighted && (
                    <p className="text-xs font-medium text-primary">Just completed</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
